import { Prisma } from '@prisma/client';
import type { Asset, Income, IncomeReceipt, Liability, MandatoryExpense } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  type AssetDTO,
  type AssetType,
  type Frequency,
  type IncomeDTO,
  type IncomeReceiptDTO,
  type IncomeType,
  type LiabilityDTO,
  type LiabilityType,
  type LiquidityType,
  type MandatoryExpenseCategory,
  type MandatoryExpenseDTO,
  type TransferResult,
} from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { convertCurrency } from '../../lib/currency.js';
import { evaluateMoneyBadges } from './money-badges.js';
import type { AssetInput, IncomeInput, LiabilityInput, MandatoryExpenseInput } from './finances.schema.js';

const dec = (d: Prisma.Decimal | number | null): number => (d == null ? 0 : Number(d));
const D = (n: number) => new Prisma.Decimal(n);

async function baseCurrencyOf(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { baseCurrency: true } });
  if (!user) throw AppError.notFound('User not found');
  return user.baseCurrency;
}

/** Append a single signed money-movement row, in base currency. Fire-and-forget;
 *  callers don't depend on the return value but tests can `await` it. */
async function logCashFlow(args: {
  userId: string;
  baseAmount: number;
  kind:
    | 'INCOME_CREDIT' | 'WINDFALL_IN' | 'RECEIPT_IN'
    | 'TRANSFER_IN' | 'TRANSFER_OUT'
    | 'EXPENSE_OUT' | 'PAY_DOWN_OUT';
  occurredAt?: Date;
  note?: string | null;
  refKind?: string | null;
  refId?: string | null;
}): Promise<void> {
  if (!Number.isFinite(args.baseAmount) || args.baseAmount <= 0) return;
  await prisma.cashFlow.create({
    data: {
      userId: args.userId,
      baseAmount: D(round2(args.baseAmount)),
      kind: args.kind,
      occurredAt: args.occurredAt ?? new Date(),
      note: args.note ?? null,
      refKind: args.refKind ?? null,
      refId: args.refId ?? null,
    },
  });
}

// --- DTO mappers ----------------------------------------------------------

export const toAssetDTO = (a: Asset): AssetDTO => ({
  id: a.id, type: a.type as AssetType, name: a.name, amount: dec(a.amount), currency: a.currency,
  baseCurrencyAmount: dec(a.baseCurrencyAmount), liquidityType: a.liquidityType as LiquidityType,
  createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
});

export const toLiabilityDTO = (l: Liability): LiabilityDTO => {
  const outstanding = dec(l.outstandingAmount);
  // Pre-existing rows pre-date the originalOutstandingAmount column — treat null
  // as "we don't know how much was originally borrowed, assume current".
  const original = l.originalOutstandingAmount == null ? outstanding : dec(l.originalOutstandingAmount);
  const paidDownProgress = original > 0 ? Math.max(0, Math.min(1, (original - outstanding) / original)) : 0;
  return {
    id: l.id, type: l.type as LiabilityType, name: l.name, outstandingAmount: outstanding,
    originalOutstandingAmount: original,
    paidDownProgress,
    monthlyPayment: dec(l.monthlyPayment), currency: l.currency,
    baseCurrencyOutstandingAmount: dec(l.baseCurrencyOutstandingAmount),
    baseCurrencyMonthlyPayment: dec(l.baseCurrencyMonthlyPayment), interestRate: l.interestRate,
    createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString(),
  };
};

export const toIncomeDTO = (i: Income, latestReceipt: IncomeReceiptDTO | null = null): IncomeDTO => ({
  id: i.id, type: i.type as IncomeType, name: i.name ?? null, amount: dec(i.amount), currency: i.currency,
  baseCurrencyAmount: dec(i.baseCurrencyAmount), frequency: i.frequency as Frequency,
  depositToAssetId: i.depositToAssetId, lastDepositedMonth: i.lastDepositedMonth,
  latestReceipt,
  createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(),
});

export const toIncomeReceiptDTO = (r: IncomeReceipt): IncomeReceiptDTO => ({
  id: r.id,
  incomeId: r.incomeId,
  periodKey: r.periodKey,
  amount: dec(r.amount),
  currency: r.currency,
  baseCurrencyAmount: dec(r.baseCurrencyAmount),
  source: r.source === 'auto' ? 'auto' : 'manual',
  receivedAt: r.receivedAt.toISOString(),
  note: r.note,
  createdAt: r.createdAt.toISOString(),
});

export const toMandatoryExpenseDTO = (m: MandatoryExpense): MandatoryExpenseDTO => ({
  id: m.id, category: m.category as MandatoryExpenseCategory, amount: dec(m.amount), currency: m.currency,
  baseCurrencyAmount: dec(m.baseCurrencyAmount), frequency: m.frequency as Frequency,
  createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString(),
});

// --- Assets ---------------------------------------------------------------

export async function createAsset(userId: string, input: AssetInput): Promise<AssetDTO> {
  const base = await convertCurrency(input.amount, input.currency, await baseCurrencyOf(userId));
  const asset = await prisma.asset.create({
    data: { userId, type: input.type, name: input.name, amount: D(input.amount), currency: input.currency, baseCurrencyAmount: D(base), liquidityType: input.liquidityType },
  });
  // Seed the balance log with the initial value (used by the per-asset chart).
  await prisma.assetBalanceEntry.create({
    data: { userId, assetId: asset.id, amount: D(input.amount), recordedAt: new Date(), source: 'manual' },
  });
  await evaluateMoneyBadges(userId);
  return toAssetDTO(asset);
}

export async function listAssets(userId: string): Promise<AssetDTO[]> {
  return (await prisma.asset.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })).map(toAssetDTO);
}

export async function updateAsset(userId: string, id: string, input: Partial<AssetInput>): Promise<AssetDTO> {
  const existing = await prisma.asset.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Asset not found');
  const data: Prisma.AssetUpdateInput = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.name !== undefined) data.name = input.name;
  if (input.liquidityType !== undefined) data.liquidityType = input.liquidityType;
  let amountChanged = false;
  let newAmount = dec(existing.amount);
  if (input.amount !== undefined || input.currency !== undefined) {
    newAmount = input.amount ?? dec(existing.amount);
    const currency = input.currency ?? existing.currency;
    data.amount = D(newAmount);
    data.currency = currency;
    data.baseCurrencyAmount = D(await convertCurrency(newAmount, currency, await baseCurrencyOf(userId)));
    amountChanged = newAmount !== dec(existing.amount);
  }
  const updated = await prisma.asset.update({ where: { id }, data });
  // Every change in *value* gets a log entry for the per-asset history chart.
  if (amountChanged) {
    await prisma.assetBalanceEntry.create({
      data: { userId, assetId: id, amount: D(newAmount), recordedAt: new Date(), source: 'manual' },
    });
  }
  return toAssetDTO(updated);
}

/**
 * Lightweight balance update used by the net-worth tracker (just the native
 * amount, no other fields). Writes a balance entry — the tracker's bread & butter.
 */
export async function setAssetBalance(userId: string, assetId: string, amount: number, recordedAt?: Date): Promise<AssetDTO> {
  const existing = await prisma.asset.findFirst({ where: { id: assetId, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Asset not found');
  if (!Number.isFinite(amount) || amount < 0) throw AppError.badRequest('Enter a non-negative amount');
  const base = await convertCurrency(amount, existing.currency, await baseCurrencyOf(userId));
  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: { amount: D(amount), baseCurrencyAmount: D(base) },
  });
  await prisma.assetBalanceEntry.create({
    data: { userId, assetId, amount: D(amount), recordedAt: recordedAt ?? new Date(), source: 'manual' },
  });
  return toAssetDTO(updated);
}

/** Soft-delete: tombstone the asset so the user can undo. Real rows are kept. */
export async function deleteAsset(userId: string, id: string): Promise<void> {
  const existing = await prisma.asset.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Asset not found');
  await prisma.asset.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Undo a soft-delete (within the 5s toast window or much longer — there's no expiry). */
export async function restoreAsset(userId: string, id: string): Promise<AssetDTO> {
  const existing = await prisma.asset.findFirst({ where: { id, userId, NOT: { deletedAt: null } } });
  if (!existing) throw AppError.notFound('Asset not found');
  const restored = await prisma.asset.update({ where: { id }, data: { deletedAt: null } });
  return toAssetDTO(restored);
}

/** Add a windfall to an account balance (bonus, refund, gift). Amount in the
 *  asset's own currency. Writes a balance log entry and a CashFlow inflow row. */
export async function depositToAsset(userId: string, assetId: string, amount: number, note?: string | null): Promise<AssetDTO> {
  if (amount <= 0) throw AppError.badRequest('Deposit must be greater than 0');
  const asset = await prisma.asset.findFirst({ where: { id: assetId, userId, deletedAt: null } });
  if (!asset) throw AppError.notFound('Account not found');
  const newAmount = round2(dec(asset.amount) + amount);
  const baseCurrency = await baseCurrencyOf(userId);
  const newBase = await convertCurrency(newAmount, asset.currency, baseCurrency);
  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: { amount: D(newAmount), baseCurrencyAmount: D(newBase) },
  });
  await prisma.assetBalanceEntry.create({
    data: { userId, assetId, amount: D(newAmount), recordedAt: new Date(), source: 'deposit', note: note ?? null },
  });
  await logCashFlow({
    userId,
    baseAmount: await convertCurrency(amount, asset.currency, baseCurrency),
    kind: 'WINDFALL_IN',
    note: note ?? `Deposit to ${asset.name}`,
    refKind: 'asset',
    refId: asset.id,
  });
  return toAssetDTO(updated);
}

/**
 * Atomic transfer between two of the user's accounts. Cross-currency is OK —
 * the destination is credited the FX-converted amount using the latest rate.
 * Writes two paired AssetBalanceEntry rows (linked via `transferId`) so the UI
 * can reconcile both legs as one event.
 */
export async function transferBetweenAssets(
  userId: string,
  fromAssetId: string,
  toAssetId: string,
  amount: number,
  note?: string | null,
): Promise<TransferResult> {
  if (amount <= 0) throw AppError.badRequest('Transfer must be greater than 0');
  if (fromAssetId === toAssetId) throw AppError.badRequest('Pick a different destination account');

  const [from, to] = await Promise.all([
    prisma.asset.findFirst({ where: { id: fromAssetId, userId, deletedAt: null } }),
    prisma.asset.findFirst({ where: { id: toAssetId, userId, deletedAt: null } }),
  ]);
  if (!from) throw AppError.badRequest('Source account not found');
  if (!to) throw AppError.badRequest('Destination account not found');
  if (amount > dec(from.amount)) throw AppError.badRequest('Not enough in the source account');

  const baseCurrency = await baseCurrencyOf(userId);
  const toAmount = round2(await convertCurrency(amount, from.currency, to.currency));
  const fxRate = amount > 0 ? toAmount / amount : 1;

  const transferId = randomUUID();
  const newFromAmount = round2(dec(from.amount) - amount);
  const newToAmount = round2(dec(to.amount) + toAmount);
  const newFromBase = await convertCurrency(newFromAmount, from.currency, baseCurrency);
  const newToBase = await convertCurrency(newToAmount, to.currency, baseCurrency);
  const baseDelta = await convertCurrency(amount, from.currency, baseCurrency);
  const now = new Date();

  // Touch both balances + write paired entries + cash-flow rows in one TX.
  await prisma.$transaction([
    prisma.asset.update({ where: { id: from.id }, data: { amount: D(newFromAmount), baseCurrencyAmount: D(newFromBase) } }),
    prisma.asset.update({ where: { id: to.id }, data: { amount: D(newToAmount), baseCurrencyAmount: D(newToBase) } }),
    prisma.assetBalanceEntry.create({
      data: {
        userId, assetId: from.id, amount: D(newFromAmount), recordedAt: now,
        source: 'transfer-out', note: note ?? `Transfer to ${to.name}`, transferId,
      },
    }),
    prisma.assetBalanceEntry.create({
      data: {
        userId, assetId: to.id, amount: D(newToAmount), recordedAt: now,
        source: 'transfer-in', note: note ?? `Transfer from ${from.name}`, transferId,
      },
    }),
    // CashFlow logs both sides so the "this month" strip is consistent if you
    // ever filter only inflow or only outflow. Net effect = 0 on net change.
    prisma.cashFlow.create({
      data: {
        userId, baseAmount: D(round2(baseDelta)), kind: 'TRANSFER_OUT',
        occurredAt: now, note: note ?? `Transfer to ${to.name}`,
        refKind: 'transfer', refId: transferId,
      },
    }),
    prisma.cashFlow.create({
      data: {
        userId, baseAmount: D(round2(baseDelta)), kind: 'TRANSFER_IN',
        occurredAt: now, note: note ?? `Transfer from ${from.name}`,
        refKind: 'transfer', refId: transferId,
      },
    }),
  ]);

  return {
    transferId,
    fromAssetId: from.id,
    toAssetId: to.id,
    fromAmount: amount,
    fromCurrency: from.currency,
    toAmount,
    toCurrency: to.currency,
    fxRate: round2Six(fxRate),
  };
}

// --- Liabilities ----------------------------------------------------------

export async function createLiability(userId: string, input: LiabilityInput): Promise<LiabilityDTO> {
  const base = await baseCurrencyOf(userId);
  const liability = await prisma.liability.create({
    data: {
      userId, type: input.type, name: input.name,
      outstandingAmount: D(input.outstandingAmount),
      originalOutstandingAmount: D(input.outstandingAmount), // baseline for "% paid down"
      monthlyPayment: D(input.monthlyPayment), currency: input.currency,
      baseCurrencyOutstandingAmount: D(await convertCurrency(input.outstandingAmount, input.currency, base)),
      baseCurrencyMonthlyPayment: D(await convertCurrency(input.monthlyPayment, input.currency, base)),
      interestRate: input.interestRate ?? null,
    },
  });
  return toLiabilityDTO(liability);
}

export async function listLiabilities(userId: string): Promise<LiabilityDTO[]> {
  return (await prisma.liability.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })).map(toLiabilityDTO);
}

export async function updateLiability(userId: string, id: string, input: Partial<LiabilityInput>): Promise<LiabilityDTO> {
  const existing = await prisma.liability.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Liability not found');
  const base = await baseCurrencyOf(userId);
  const currency = input.currency ?? existing.currency;
  const data: Prisma.LiabilityUpdateInput = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.name !== undefined) data.name = input.name;
  if (input.interestRate !== undefined) data.interestRate = input.interestRate;
  if (input.currency !== undefined) data.currency = currency;
  if (input.outstandingAmount !== undefined) {
    data.outstandingAmount = D(input.outstandingAmount);
    data.baseCurrencyOutstandingAmount = D(await convertCurrency(input.outstandingAmount, currency, base));
    // If the user edits outstanding *upwards* past the original, bump the
    // baseline so the progress bar stays anchored to the new high-water mark.
    const originalNow = existing.originalOutstandingAmount == null
      ? dec(existing.outstandingAmount)
      : dec(existing.originalOutstandingAmount);
    if (input.outstandingAmount > originalNow) {
      data.originalOutstandingAmount = D(input.outstandingAmount);
    }
  }
  if (input.monthlyPayment !== undefined) {
    data.monthlyPayment = D(input.monthlyPayment);
    data.baseCurrencyMonthlyPayment = D(await convertCurrency(input.monthlyPayment, currency, base));
  }
  return toLiabilityDTO(await prisma.liability.update({ where: { id }, data }));
}

export async function deleteLiability(userId: string, id: string): Promise<void> {
  const existing = await prisma.liability.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Liability not found');
  await prisma.liability.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function restoreLiability(userId: string, id: string): Promise<LiabilityDTO> {
  const existing = await prisma.liability.findFirst({ where: { id, userId, NOT: { deletedAt: null } } });
  if (!existing) throw AppError.notFound('Liability not found');
  const restored = await prisma.liability.update({ where: { id }, data: { deletedAt: null } });
  return toLiabilityDTO(restored);
}

/** Pay down a liability; optionally deduct the amount from a real account so net
 *  worth stays consistent (analogous to goal contributions from a pot). */
export async function payDownLiability(
  userId: string,
  liabilityId: string,
  amount: number,
  fromAssetId?: string | null,
): Promise<LiabilityDTO> {
  if (amount <= 0) throw AppError.badRequest('Payment must be greater than 0');
  const liability = await prisma.liability.findFirst({ where: { id: liabilityId, userId, deletedAt: null } });
  if (!liability) throw AppError.notFound('Loan not found');
  const base = await baseCurrencyOf(userId);

  if (fromAssetId) {
    const asset = await prisma.asset.findFirst({ where: { id: fromAssetId, userId, deletedAt: null } });
    if (!asset) throw AppError.badRequest('Source account not found');
    const debit = await convertCurrency(amount, liability.currency, asset.currency);
    if (debit > dec(asset.amount)) throw AppError.badRequest('Not enough in that account for this payment');
    const newAssetAmount = round2(dec(asset.amount) - debit);
    const newAssetBase = await convertCurrency(newAssetAmount, asset.currency, base);
    await prisma.asset.update({
      where: { id: asset.id },
      data: { amount: D(newAssetAmount), baseCurrencyAmount: D(newAssetBase) },
    });
    await prisma.assetBalanceEntry.create({
      data: { userId, assetId: asset.id, amount: D(newAssetAmount), recordedAt: new Date(), source: 'loan-payment', note: `Paid down ${liability.name}` },
    });
  }

  const newOutstanding = Math.max(0, round2(dec(liability.outstandingAmount) - amount));
  const newOutstandingBase = await convertCurrency(newOutstanding, liability.currency, base);
  const updated = await prisma.liability.update({
    where: { id: liabilityId },
    data: {
      outstandingAmount: D(newOutstanding),
      baseCurrencyOutstandingAmount: D(newOutstandingBase),
    },
  });
  await logCashFlow({
    userId,
    baseAmount: await convertCurrency(amount, liability.currency, base),
    kind: 'PAY_DOWN_OUT',
    note: `Paid down ${liability.name}`,
    refKind: 'liability',
    refId: liability.id,
  });
  await evaluateMoneyBadges(userId);
  return toLiabilityDTO(updated);
}

// --- Incomes & Mandatory expenses (create/list) ---------------------------

export async function createIncome(userId: string, input: IncomeInput & { name?: string | null }): Promise<IncomeDTO> {
  const base = await convertCurrency(input.amount, input.currency, await baseCurrencyOf(userId));
  const income = await prisma.income.create({
    data: {
      userId, type: input.type, name: input.name ?? null,
      amount: D(input.amount), currency: input.currency, baseCurrencyAmount: D(base),
      frequency: input.frequency,
    },
  });
  await evaluateMoneyBadges(userId);
  return toIncomeDTO(income);
}

export async function listIncomes(userId: string): Promise<IncomeDTO[]> {
  const incomes = await prisma.income.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { receipts: { orderBy: { periodKey: 'desc' }, take: 1 } },
  });
  return incomes.map((i) =>
    toIncomeDTO(i, i.receipts[0] ? toIncomeReceiptDTO(i.receipts[0]) : null),
  );
}

export async function createMandatoryExpense(userId: string, input: MandatoryExpenseInput): Promise<MandatoryExpenseDTO> {
  const base = await convertCurrency(input.amount, input.currency, await baseCurrencyOf(userId));
  const m = await prisma.mandatoryExpense.create({
    data: { userId, category: input.category, amount: D(input.amount), currency: input.currency, baseCurrencyAmount: D(base), frequency: input.frequency },
  });
  return toMandatoryExpenseDTO(m);
}

export async function listMandatoryExpenses(userId: string): Promise<MandatoryExpenseDTO[]> {
  return (await prisma.mandatoryExpense.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })).map(toMandatoryExpenseDTO);
}

export async function deleteIncome(userId: string, id: string): Promise<void> {
  const existing = await prisma.income.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Income not found');
  await prisma.income.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function restoreIncome(userId: string, id: string): Promise<IncomeDTO> {
  const existing = await prisma.income.findFirst({ where: { id, userId, NOT: { deletedAt: null } } });
  if (!existing) throw AppError.notFound('Income not found');
  const restored = await prisma.income.update({ where: { id }, data: { deletedAt: null } });
  return toIncomeDTO(restored);
}

export async function deleteMandatoryExpense(userId: string, id: string): Promise<void> {
  const existing = await prisma.mandatoryExpense.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Mandatory expense not found');
  await prisma.mandatoryExpense.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function restoreMandatoryExpense(userId: string, id: string): Promise<MandatoryExpenseDTO> {
  const existing = await prisma.mandatoryExpense.findFirst({ where: { id, userId, NOT: { deletedAt: null } } });
  if (!existing) throw AppError.notFound('Mandatory expense not found');
  const restored = await prisma.mandatoryExpense.update({ where: { id }, data: { deletedAt: null } });
  return toMandatoryExpenseDTO(restored);
}

// --- Editing recurring rows (amount, frequency, deposit target, name) -----

export async function updateIncome(
  userId: string,
  id: string,
  input: { type?: IncomeType; name?: string | null; amount?: number; currency?: string; frequency?: Frequency; depositToAssetId?: string | null },
): Promise<IncomeDTO> {
  const existing = await prisma.income.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Income not found');
  const base = await baseCurrencyOf(userId);
  const data: Prisma.IncomeUpdateInput = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.name !== undefined) data.name = input.name ?? null;
  if (input.frequency !== undefined) data.frequency = input.frequency;
  if (input.amount !== undefined || input.currency !== undefined) {
    const amount = input.amount ?? dec(existing.amount);
    const currency = input.currency ?? existing.currency;
    data.amount = D(amount);
    data.currency = currency;
    data.baseCurrencyAmount = D(await convertCurrency(amount, currency, base));
  }
  if (input.depositToAssetId !== undefined) {
    if (input.depositToAssetId) {
      // Verify the user owns the target asset. Cross-currency is fine — the
      // cron converts at deposit time and notes the FX rate.
      const owned = await prisma.asset.findFirst({
        where: { id: input.depositToAssetId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!owned) throw AppError.badRequest('Selected account not found');
      data.depositToAssetId = input.depositToAssetId;
    } else {
      data.depositToAssetId = null;
    }
  }
  return toIncomeDTO(await prisma.income.update({ where: { id }, data }));
}

export async function updateMandatoryExpense(
  userId: string,
  id: string,
  input: { category?: MandatoryExpenseCategory; amount?: number; currency?: string; frequency?: Frequency },
): Promise<MandatoryExpenseDTO> {
  const existing = await prisma.mandatoryExpense.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw AppError.notFound('Mandatory expense not found');
  const base = await baseCurrencyOf(userId);
  const data: Prisma.MandatoryExpenseUpdateInput = {};
  if (input.category !== undefined) data.category = input.category;
  if (input.frequency !== undefined) data.frequency = input.frequency;
  if (input.amount !== undefined || input.currency !== undefined) {
    const amount = input.amount ?? dec(existing.amount);
    const currency = input.currency ?? existing.currency;
    data.amount = D(amount);
    data.currency = currency;
    data.baseCurrencyAmount = D(await convertCurrency(amount, currency, base));
  }
  return toMandatoryExpenseDTO(await prisma.mandatoryExpense.update({ where: { id }, data }));
}

// --- Income receipts (variable-pay actuals) -------------------------------

/** Log (or overwrite) the actual amount received for an income in a period.
 *  The auto-deposit cron prefers this over the modelled amount when present. */
export async function logIncomeReceipt(
  userId: string,
  incomeId: string,
  input: { periodKey: string; amount: number; note?: string | null; receivedAt?: Date },
): Promise<IncomeReceiptDTO> {
  if (!/^\d{4}-\d{2}$/.test(input.periodKey)) {
    throw AppError.badRequest('Period must be YYYY-MM');
  }
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw AppError.badRequest('Amount must be zero or positive');
  }
  const income = await prisma.income.findFirst({ where: { id: incomeId, userId, deletedAt: null } });
  if (!income) throw AppError.notFound('Income not found');
  const base = await baseCurrencyOf(userId);
  const baseAmount = await convertCurrency(input.amount, income.currency, base);
  const row = await prisma.incomeReceipt.upsert({
    where: { incomeId_periodKey: { incomeId, periodKey: input.periodKey } },
    update: {
      amount: D(input.amount),
      currency: income.currency,
      baseCurrencyAmount: D(baseAmount),
      source: 'manual',
      receivedAt: input.receivedAt ?? new Date(),
      note: input.note ?? null,
    },
    create: {
      userId,
      incomeId,
      periodKey: input.periodKey,
      amount: D(input.amount),
      currency: income.currency,
      baseCurrencyAmount: D(baseAmount),
      source: 'manual',
      receivedAt: input.receivedAt ?? new Date(),
      note: input.note ?? null,
    },
  });
  // Manual log doesn't move money — it's a record of what already arrived
  // outside our app. We don't fire CashFlow here; the cron does that at credit time.
  return toIncomeReceiptDTO(row);
}

export async function listIncomeReceipts(userId: string, incomeId: string, limit = 12): Promise<IncomeReceiptDTO[]> {
  const income = await prisma.income.findFirst({ where: { id: incomeId, userId, deletedAt: null } });
  if (!income) throw AppError.notFound('Income not found');
  const rows = await prisma.incomeReceipt.findMany({
    where: { incomeId },
    orderBy: { periodKey: 'desc' },
    take: Math.min(60, Math.max(1, limit)),
  });
  return rows.map(toIncomeReceiptDTO);
}

export async function deleteIncomeReceipt(userId: string, incomeId: string, periodKey: string): Promise<void> {
  const income = await prisma.income.findFirst({ where: { id: incomeId, userId, deletedAt: null } });
  if (!income) throw AppError.notFound('Income not found');
  await prisma.incomeReceipt.deleteMany({ where: { incomeId, periodKey } });
}

// --- Monthly auto-deposit (salary → account) ------------------------------

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * For each income with `depositToAssetId` whose `lastDepositedMonth` is older
 * than `month`, credits the target account by the actual receipt amount for
 * the previous month if logged (variable-pay path), else the modelled income
 * amount. Cross-currency conversion happens here using the latest FX rate;
 * the balance entry note carries the rate used for transparency.
 */
export async function processAutoDeposits(userId: string, month: string = monthKey()): Promise<number> {
  const incomes = await prisma.income.findMany({
    where: { userId, deletedAt: null, depositToAssetId: { not: null }, NOT: { lastDepositedMonth: month } },
  });
  let credited = 0;
  const baseCurrency = await baseCurrencyOf(userId);
  // The credit pays for the *previous* completed month — that's what variable-
  // income receipts are logged against (you can't log this month's pay on the 1st).
  const prevMonth = previousMonthKey(month);

  for (const inc of incomes) {
    if (!inc.depositToAssetId) continue;
    const asset = await prisma.asset.findFirst({ where: { id: inc.depositToAssetId, userId, deletedAt: null } });
    if (!asset) continue;

    // Prefer the actual logged receipt for the previous month if it exists.
    const receipt = await prisma.incomeReceipt.findUnique({
      where: { incomeId_periodKey: { incomeId: inc.id, periodKey: prevMonth } },
    });
    const nativeFromIncome = dec(inc.amount);
    const nativeAmount = receipt ? dec(receipt.amount) : nativeFromIncome;
    if (nativeAmount <= 0) {
      // Nothing to credit (logged zero for the month) — still stamp so we don't retry.
      await prisma.income.update({ where: { id: inc.id }, data: { lastDepositedMonth: month } });
      continue;
    }

    const credit = await convertCurrency(nativeAmount, inc.currency, asset.currency);
    const fxRate = nativeAmount > 0 ? credit / nativeAmount : 1;
    const newAmount = round2(dec(asset.amount) + credit);
    const newBase = await convertCurrency(newAmount, asset.currency, baseCurrency);

    const label = receipt ? 'actual' : 'modelled';
    const noteFx = inc.currency === asset.currency
      ? `Auto-credit (${label}) · ${month}`
      : `Auto-credit (${label}) · ${nativeAmount.toFixed(2)} ${inc.currency} → ${round2(credit)} ${asset.currency} @ ${fxRate.toFixed(4)}`;

    await prisma.asset.update({
      where: { id: asset.id },
      data: { amount: D(newAmount), baseCurrencyAmount: D(newBase) },
    });
    await prisma.assetBalanceEntry.create({
      data: {
        userId, assetId: asset.id, amount: D(newAmount), recordedAt: new Date(),
        source: `salary-auto:${month}`, note: noteFx,
      },
    });
    await logCashFlow({
      userId,
      baseAmount: await convertCurrency(nativeAmount, inc.currency, baseCurrency),
      kind: 'INCOME_CREDIT',
      note: noteFx,
      refKind: 'income',
      refId: inc.id,
    });
    // Stamp an 'auto' receipt for this month so the history shows what was credited.
    if (!receipt) {
      await prisma.incomeReceipt.upsert({
        where: { incomeId_periodKey: { incomeId: inc.id, periodKey: prevMonth } },
        update: {},
        create: {
          userId,
          incomeId: inc.id,
          periodKey: prevMonth,
          amount: D(nativeAmount),
          currency: inc.currency,
          baseCurrencyAmount: D(await convertCurrency(nativeAmount, inc.currency, baseCurrency)),
          source: 'auto',
          receivedAt: new Date(),
        },
      });
    }
    await prisma.income.update({ where: { id: inc.id }, data: { lastDepositedMonth: month } });
    credited += 1;
  }
  return credited;
}

/** Scheduler hook: run auto-deposits for every user. */
export async function processAutoDepositsForAllUsers(month: string = monthKey()): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  let total = 0;
  for (const u of users) total += await processAutoDeposits(u.id, month);
  return total;
}

// --- helpers --------------------------------------------------------------

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function round2Six(n: number): number {
  return Math.round((n + Number.EPSILON) * 1_000_000) / 1_000_000;
}
function previousMonthKey(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

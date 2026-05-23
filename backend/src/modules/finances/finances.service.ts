import { Prisma } from '@prisma/client';
import type { Asset, Income, Liability, MandatoryExpense } from '@prisma/client';
import {
  type AssetDTO,
  type AssetType,
  type Frequency,
  type IncomeDTO,
  type IncomeType,
  type LiabilityDTO,
  type LiabilityType,
  type LiquidityType,
  type MandatoryExpenseCategory,
  type MandatoryExpenseDTO,
} from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { convertCurrency } from '../../lib/currency.js';
import type { AssetInput, IncomeInput, LiabilityInput, MandatoryExpenseInput } from './finances.schema.js';

const dec = (d: Prisma.Decimal | number | null): number => (d == null ? 0 : Number(d));
const D = (n: number) => new Prisma.Decimal(n);

async function baseCurrencyOf(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { baseCurrency: true } });
  if (!user) throw AppError.notFound('User not found');
  return user.baseCurrency;
}

// --- DTO mappers ----------------------------------------------------------

export const toAssetDTO = (a: Asset): AssetDTO => ({
  id: a.id, type: a.type as AssetType, name: a.name, amount: dec(a.amount), currency: a.currency,
  baseCurrencyAmount: dec(a.baseCurrencyAmount), liquidityType: a.liquidityType as LiquidityType,
  createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
});

export const toLiabilityDTO = (l: Liability): LiabilityDTO => ({
  id: l.id, type: l.type as LiabilityType, name: l.name, outstandingAmount: dec(l.outstandingAmount),
  monthlyPayment: dec(l.monthlyPayment), currency: l.currency,
  baseCurrencyOutstandingAmount: dec(l.baseCurrencyOutstandingAmount),
  baseCurrencyMonthlyPayment: dec(l.baseCurrencyMonthlyPayment), interestRate: l.interestRate,
  createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString(),
});

export const toIncomeDTO = (i: Income): IncomeDTO => ({
  id: i.id, type: i.type as IncomeType, amount: dec(i.amount), currency: i.currency,
  baseCurrencyAmount: dec(i.baseCurrencyAmount), frequency: i.frequency as Frequency,
  createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(),
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
  return toAssetDTO(asset);
}

export async function listAssets(userId: string): Promise<AssetDTO[]> {
  return (await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })).map(toAssetDTO);
}

export async function updateAsset(userId: string, id: string, input: Partial<AssetInput>): Promise<AssetDTO> {
  const existing = await prisma.asset.findFirst({ where: { id, userId } });
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
  const existing = await prisma.asset.findFirst({ where: { id: assetId, userId } });
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

export async function deleteAsset(userId: string, id: string): Promise<void> {
  const existing = await prisma.asset.findFirst({ where: { id, userId } });
  if (!existing) throw AppError.notFound('Asset not found');
  await prisma.asset.delete({ where: { id } });
}

// --- Liabilities ----------------------------------------------------------

export async function createLiability(userId: string, input: LiabilityInput): Promise<LiabilityDTO> {
  const base = await baseCurrencyOf(userId);
  const liability = await prisma.liability.create({
    data: {
      userId, type: input.type, name: input.name,
      outstandingAmount: D(input.outstandingAmount), monthlyPayment: D(input.monthlyPayment), currency: input.currency,
      baseCurrencyOutstandingAmount: D(await convertCurrency(input.outstandingAmount, input.currency, base)),
      baseCurrencyMonthlyPayment: D(await convertCurrency(input.monthlyPayment, input.currency, base)),
      interestRate: input.interestRate ?? null,
    },
  });
  return toLiabilityDTO(liability);
}

export async function listLiabilities(userId: string): Promise<LiabilityDTO[]> {
  return (await prisma.liability.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })).map(toLiabilityDTO);
}

export async function updateLiability(userId: string, id: string, input: Partial<LiabilityInput>): Promise<LiabilityDTO> {
  const existing = await prisma.liability.findFirst({ where: { id, userId } });
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
  }
  if (input.monthlyPayment !== undefined) {
    data.monthlyPayment = D(input.monthlyPayment);
    data.baseCurrencyMonthlyPayment = D(await convertCurrency(input.monthlyPayment, currency, base));
  }
  return toLiabilityDTO(await prisma.liability.update({ where: { id }, data }));
}

export async function deleteLiability(userId: string, id: string): Promise<void> {
  const existing = await prisma.liability.findFirst({ where: { id, userId } });
  if (!existing) throw AppError.notFound('Liability not found');
  await prisma.liability.delete({ where: { id } });
}

// --- Incomes & Mandatory expenses (create/list) ---------------------------

export async function createIncome(userId: string, input: IncomeInput): Promise<IncomeDTO> {
  const base = await convertCurrency(input.amount, input.currency, await baseCurrencyOf(userId));
  const income = await prisma.income.create({
    data: { userId, type: input.type, amount: D(input.amount), currency: input.currency, baseCurrencyAmount: D(base), frequency: input.frequency },
  });
  return toIncomeDTO(income);
}

export async function listIncomes(userId: string): Promise<IncomeDTO[]> {
  return (await prisma.income.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })).map(toIncomeDTO);
}

export async function createMandatoryExpense(userId: string, input: MandatoryExpenseInput): Promise<MandatoryExpenseDTO> {
  const base = await convertCurrency(input.amount, input.currency, await baseCurrencyOf(userId));
  const m = await prisma.mandatoryExpense.create({
    data: { userId, category: input.category, amount: D(input.amount), currency: input.currency, baseCurrencyAmount: D(base), frequency: input.frequency },
  });
  return toMandatoryExpenseDTO(m);
}

export async function listMandatoryExpenses(userId: string): Promise<MandatoryExpenseDTO[]> {
  return (await prisma.mandatoryExpense.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })).map(toMandatoryExpenseDTO);
}

export async function deleteIncome(userId: string, id: string): Promise<void> {
  const existing = await prisma.income.findFirst({ where: { id, userId } });
  if (!existing) throw AppError.notFound('Income not found');
  await prisma.income.delete({ where: { id } });
}

export async function deleteMandatoryExpense(userId: string, id: string): Promise<void> {
  const existing = await prisma.mandatoryExpense.findFirst({ where: { id, userId } });
  if (!existing) throw AppError.notFound('Mandatory expense not found');
  await prisma.mandatoryExpense.delete({ where: { id } });
}

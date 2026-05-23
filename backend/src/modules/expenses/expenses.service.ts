import { Prisma } from '@prisma/client';
import type { Expense } from '@prisma/client';
import {
  ExpenseCategory,
  type ExpenseDTO,
  type ExpenseGranularity,
  type ExpenseTrendBin,
  type ExpenseTrendPoint,
  type ExpenseTrendResult,
  type MonthlySummary,
  type NeedOrWant,
  type PaymentMethod,
  type QuickAddSuggestion,
  type SyncStatus,
} from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { convertCurrency } from '../../lib/currency.js';
import { getFinancialSummary } from '../profile/profile.service.js';
import { recordExpenseLogged } from '../streaks/streaks.service.js';
import { incomeByMonth } from '../income-history/income-history.service.js';
import type { CreateExpenseInput, ListQuery, SyncOfflineInput, UpdateExpenseInput } from './expenses.schema.js';

const dec = (d: Prisma.Decimal | number): number => Number(d);

export function toExpenseDTO(e: Expense): ExpenseDTO {
  return {
    id: e.id,
    amount: dec(e.amount),
    currency: e.currency,
    baseCurrencyAmount: dec(e.baseCurrencyAmount),
    category: e.category as ExpenseCategory,
    note: e.note,
    date: e.date.toISOString(),
    paymentMethod: e.paymentMethod as PaymentMethod,
    isRecurring: e.isRecurring,
    needOrWant: e.needOrWant as NeedOrWant,
    linkedGoalId: e.linkedGoalId,
    syncStatus: e.syncStatus as SyncStatus,
    clientId: e.clientId,
    createdAt: e.createdAt.toISOString(),
  };
}

async function buildCreateData(userId: string, baseCurrency: string, input: CreateExpenseInput) {
  const baseAmount = await convertCurrency(input.amount, input.currency, baseCurrency);
  // Only link a goal the user actually owns.
  let linkedGoalId: string | null = null;
  if (input.linkedGoalId) {
    const goal = await prisma.goal.findFirst({ where: { id: input.linkedGoalId, userId } });
    linkedGoalId = goal ? goal.id : null;
  }
  return {
    userId,
    amount: new Prisma.Decimal(input.amount),
    currency: input.currency,
    baseCurrencyAmount: new Prisma.Decimal(baseAmount),
    category: input.category,
    note: input.note ?? null,
    date: input.date ? new Date(input.date) : new Date(),
    paymentMethod: input.paymentMethod,
    isRecurring: input.isRecurring,
    needOrWant: input.needOrWant,
    linkedGoalId,
    clientId: input.clientId ?? null,
    syncStatus: 'SYNCED' as const,
  };
}

export async function createExpense(userId: string, input: CreateExpenseInput): Promise<ExpenseDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  const data = await buildCreateData(userId, user.baseCurrency, input);

  // If a clientId is supplied, upsert so retries/offline replays don't duplicate.
  if (data.clientId) {
    const expense = await prisma.expense.upsert({
      where: { userId_clientId: { userId, clientId: data.clientId } },
      update: {}, // first-write-wins; an existing row is treated as already saved
      create: data,
    });
    await recordExpenseLogged(userId, expense.date);
    return toExpenseDTO(expense);
  }

  const expense = await prisma.expense.create({ data });
  // Note: we *don't* mirror expenses into CashFlow — the FinancialSummary adds
  // expense totals separately so we'd double-count if we did.
  await recordExpenseLogged(userId, expense.date);
  return toExpenseDTO(expense);
}

export async function listExpenses(userId: string, query: ListQuery): Promise<ExpenseDTO[]> {
  const where: Prisma.ExpenseWhereInput = { userId };
  if (query.category) where.category = query.category;
  if (query.month) {
    const { start, end } = monthRange(query.month);
    where.date = { gte: start, lt: end };
  }
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
    take: query.limit,
  });
  return expenses.map(toExpenseDTO);
}

export async function updateExpense(userId: string, id: string, input: UpdateExpenseInput): Promise<ExpenseDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) throw AppError.notFound('Expense not found');

  const data: Prisma.ExpenseUpdateInput = {};
  if (input.category !== undefined) data.category = input.category;
  if (input.note !== undefined) data.note = input.note;
  if (input.date !== undefined && input.date) data.date = new Date(input.date);
  if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
  if (input.isRecurring !== undefined) data.isRecurring = input.isRecurring;
  if (input.needOrWant !== undefined) data.needOrWant = input.needOrWant;
  if (input.amount !== undefined || input.currency !== undefined) {
    const amount = input.amount ?? dec(existing.amount);
    const currency = input.currency ?? existing.currency;
    data.amount = new Prisma.Decimal(amount);
    data.currency = currency;
    data.baseCurrencyAmount = new Prisma.Decimal(await convertCurrency(amount, currency, user.baseCurrency));
  }

  const expense = await prisma.expense.update({ where: { id }, data });
  return toExpenseDTO(expense);
}

export async function deleteExpense(userId: string, id: string): Promise<void> {
  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) throw AppError.notFound('Expense not found');
  await prisma.expense.delete({ where: { id } });
}

/** Idempotently persists a batch of offline-queued expenses, keyed by clientId. */
export async function syncOffline(userId: string, input: SyncOfflineInput): Promise<{ synced: ExpenseDTO[] }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  const synced: ExpenseDTO[] = [];
  for (const item of input.expenses) {
    const data = await buildCreateData(userId, user.baseCurrency, item);
    const expense = await prisma.expense.upsert({
      where: { userId_clientId: { userId, clientId: item.clientId } },
      update: {},
      create: data,
    });
    await recordExpenseLogged(userId, expense.date);
    synced.push(toExpenseDTO(expense));
  }
  return { synced };
}

export async function monthlySummary(userId: string, month?: string): Promise<MonthlySummary> {
  const monthKey = month ?? toMonthKey(new Date());
  const { start, end } = monthRange(monthKey);
  const summary = await getFinancialSummary(userId);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { baseCurrencyAmount: true, category: true, needOrWant: true },
  });

  const total = round2(expenses.reduce((s, e) => s + dec(e.baseCurrencyAmount), 0));
  const count = expenses.length;

  const byCategoryMap = new Map<string, number>();
  let needTotal = 0;
  let wantTotal = 0;
  for (const e of expenses) {
    byCategoryMap.set(e.category, (byCategoryMap.get(e.category) ?? 0) + dec(e.baseCurrencyAmount));
    if (e.needOrWant === 'NEED') needTotal += dec(e.baseCurrencyAmount);
    else wantTotal += dec(e.baseCurrencyAmount);
  }
  const byCategory = [...byCategoryMap.entries()]
    .map(([category, amount]) => ({
      category: category as ExpenseCategory,
      amount: round2(amount),
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const now = new Date();
  const isCurrentMonth = monthKey === toMonthKey(now);
  const daysInMonth = new Date(start.getUTCFullYear(), start.getUTCMonth() + 1, 0).getDate();
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
  const dailyAverage = round2(total / Math.max(1, daysElapsed));

  const monthlyBudget = summary.monthlySurplus;
  const remainingSafeSpend = round2(Math.max(0, monthlyBudget - total));

  return {
    month: monthKey,
    baseCurrency: summary.baseCurrency,
    total,
    count,
    byCategory,
    needTotal: round2(needTotal),
    wantTotal: round2(wantTotal),
    dailyAverage,
    daysElapsed,
    daysInMonth,
    monthlyBudget: round2(monthlyBudget),
    remainingSafeSpend,
    overBudget: total > monthlyBudget,
  };
}

/**
 * Income vs spending for each of the last `months` calendar months. Income uses
 * the user's current monthly income as a reference line (income history isn't
 * tracked per-month in Phase 1).
 */
export async function expenseTrend(userId: string, months = 6): Promise<ExpenseTrendPoint[]> {
  const now = new Date();
  const span = Math.min(24, Math.max(1, months));
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (span - 1), 1));

  const monthKeys: string[] = [];
  for (let i = 0; i < span; i++) {
    monthKeys.push(toMonthKey(new Date(Date.UTC(now.getFullYear(), now.getMonth() - (span - 1) + i, 1))));
  }

  const [rows, incomeMap] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: start } }, select: { date: true, baseCurrencyAmount: true } }),
    incomeByMonth(userId, monthKeys),
  ]);

  const totals = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const r of rows) {
    const key = toMonthKey(r.date);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + dec(r.baseCurrencyAmount));
  }
  return monthKeys.map((month) => ({
    month,
    total: round2(totals.get(month) ?? 0),
    income: round2(incomeMap.get(month) ?? 0),
  }));
}

/**
 * Bin expenses for the D/W/M/Y graph + compute current-vs-prior delta and the
 * single category that contributed most to the change. All in base currency.
 */
export async function expenseTrendByGranularity(
  userId: string,
  granularity: ExpenseGranularity,
  bins = defaultBinsFor(granularity),
): Promise<ExpenseTrendResult> {
  const span = Math.min(60, Math.max(2, bins));
  const now = new Date();
  const start = startOfBin(granularity, now, span - 1);

  const rows = await prisma.expense.findMany({
    where: { userId, date: { gte: start }, deletedAt: null },
    select: { date: true, baseCurrencyAmount: true, category: true },
  });

  // Generate the bucket keys we want to display, oldest first.
  const keys: string[] = [];
  for (let i = span - 1; i >= 0; i--) keys.push(binKey(granularity, addBins(granularity, now, -i)));

  const totals = new Map<string, number>(keys.map((k) => [k, 0]));
  const byBinByCat = new Map<string, Map<string, number>>(keys.map((k) => [k, new Map()]));

  for (const r of rows) {
    const k = binKey(granularity, r.date);
    if (!totals.has(k)) continue;
    const amt = dec(r.baseCurrencyAmount);
    totals.set(k, (totals.get(k) ?? 0) + amt);
    const catMap = byBinByCat.get(k)!;
    catMap.set(r.category, (catMap.get(r.category) ?? 0) + amt);
  }

  const binsOut: ExpenseTrendBin[] = keys.map((k) => ({
    key: k,
    label: binLabel(granularity, k),
    total: round2(totals.get(k) ?? 0),
  }));

  // Current = last fully-counted bin (we treat the latest as "current period
  // so far" — the user still wants the side-by-side comparison even mid-period).
  const lastIdx = binsOut.length - 1;
  const currentTotal = binsOut[lastIdx]?.total ?? 0;
  const priorTotal = binsOut[lastIdx - 1]?.total ?? 0;
  const deltaAbsolute = round2(currentTotal - priorTotal);
  const deltaPct = priorTotal > 0 ? round2(deltaAbsolute / priorTotal) : null;

  // Top mover: largest absolute swing in any single category across the two
  // most-recent bins (positive or negative).
  const curCats = byBinByCat.get(keys[lastIdx]) ?? new Map();
  const priCats = byBinByCat.get(keys[lastIdx - 1]) ?? new Map();
  let topMover: { category: ExpenseCategory; delta: number } | null = null;
  for (const cat of new Set<string>([...curCats.keys(), ...priCats.keys()])) {
    const swing = (curCats.get(cat) ?? 0) - (priCats.get(cat) ?? 0);
    if (!topMover || Math.abs(swing) > Math.abs(topMover.delta)) {
      topMover = { category: cat as ExpenseCategory, delta: round2(swing) };
    }
  }
  // Hide a zero "top mover" — there's no story to tell.
  if (topMover && Math.abs(topMover.delta) < 0.01) topMover = null;

  return { granularity, bins: binsOut, currentTotal, priorTotal, deltaAbsolute, deltaPct, topMover };
}

/**
 * Top-5 recurring spend patterns from the last 30 days, used as one-tap chips
 * on the Expenses page. Groups by (category, rounded amount, normalised note,
 * payment method) and ranks by count then recency.
 */
export async function quickAddSuggestions(userId: string, take = 5): Promise<QuickAddSuggestion[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await prisma.expense.findMany({
    where: { userId, date: { gte: thirtyDaysAgo }, deletedAt: null },
    select: {
      amount: true, currency: true, category: true, note: true,
      paymentMethod: true, needOrWant: true, date: true,
    },
    orderBy: { date: 'desc' },
  });

  const buckets = new Map<string, { row: typeof rows[number]; count: number }>();
  for (const r of rows) {
    // Bucket on whole-number native amount (most groceries vary by ₹5) — rough
    // enough to coalesce, tight enough to distinguish ₹40 metro from ₹150 coffee.
    const amtKey = Math.round(dec(r.amount)).toString();
    const noteKey = (r.note ?? '').trim().toLowerCase();
    const key = `${r.category}|${amtKey}|${r.currency}|${noteKey}|${r.paymentMethod}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { row: r, count: 1 });
    }
  }

  return [...buckets.values()]
    .filter((b) => b.count >= 2) // single-use entries aren't "patterns"
    .sort((a, b) => b.count - a.count || +b.row.date - +a.row.date)
    .slice(0, take)
    .map(({ row, count }) => ({
      category: row.category as ExpenseCategory,
      amount: dec(row.amount),
      currency: row.currency,
      note: row.note,
      paymentMethod: row.paymentMethod as PaymentMethod,
      needOrWant: row.needOrWant as NeedOrWant,
      occurrences: count,
    }));
}

// --- helpers --------------------------------------------------------------

function defaultBinsFor(g: ExpenseGranularity): number {
  if (g === 'D') return 30;
  if (g === 'W') return 12;
  if (g === 'M') return 12;
  return 6; // years
}

function startOfBin(g: ExpenseGranularity, ref: Date, backOffset: number): Date {
  if (g === 'D') {
    const d = new Date(ref);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - backOffset);
    return d;
  }
  if (g === 'W') {
    const d = new Date(ref);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // ISO week starts Monday
    d.setDate(d.getDate() - dow - backOffset * 7);
    return d;
  }
  if (g === 'M') {
    return new Date(ref.getFullYear(), ref.getMonth() - backOffset, 1);
  }
  return new Date(ref.getFullYear() - backOffset, 0, 1);
}

function addBins(g: ExpenseGranularity, ref: Date, delta: number): Date {
  if (g === 'D') {
    const d = new Date(ref);
    d.setDate(d.getDate() + delta);
    return d;
  }
  if (g === 'W') {
    const d = new Date(ref);
    d.setDate(d.getDate() + delta * 7);
    return d;
  }
  if (g === 'M') {
    return new Date(ref.getFullYear(), ref.getMonth() + delta, 1);
  }
  return new Date(ref.getFullYear() + delta, 0, 1);
}

function binKey(g: ExpenseGranularity, d: Date): string {
  if (g === 'D') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (g === 'W') {
    // ISO week (year + week number). Sufficient as a unique bucket key.
    const ref = new Date(d);
    ref.setHours(0, 0, 0, 0);
    ref.setDate(ref.getDate() + 4 - (ref.getDay() || 7));
    const yearStart = new Date(ref.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((+ref - +yearStart) / 86_400_000 + 1) / 7);
    return `${ref.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  if (g === 'M') return toMonthKey(d);
  return String(d.getFullYear());
}

function binLabel(g: ExpenseGranularity, key: string): string {
  if (g === 'D') {
    const [, m, d] = key.split('-');
    return `${d}/${m}`;
  }
  if (g === 'W') {
    const [, w] = key.split('-W');
    return `W${w}`;
  }
  if (g === 'M') {
    const [, m] = key.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m) - 1] ?? key;
  }
  return key;
}

function monthRange(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}
function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

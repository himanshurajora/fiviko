import { Prisma } from '@prisma/client';
import { ExpenseCategory, type CategoryBudgetStatus } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';

const dec = (d: Prisma.Decimal | number): number => Number(d);
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Per-category budgets joined with this calendar month's actual spending. */
export async function getBudgetStatus(userId: string): Promise<CategoryBudgetStatus[]> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [budgets, spendByCat] = await Promise.all([
    prisma.categoryBudget.findMany({ where: { userId } }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { userId, date: { gte: monthStart } },
      _sum: { baseCurrencyAmount: true },
    }),
  ]);

  const limitByCat = new Map<string, number>(budgets.map((b) => [b.category as string, dec(b.monthlyLimit)]));
  const spentByCat = new Map<string, number>(spendByCat.map((s) => [s.category as string, dec(s._sum.baseCurrencyAmount ?? new Prisma.Decimal(0))]));

  // Include every category that has a cap or any spend this month.
  const categories = new Set<string>([...limitByCat.keys(), ...spentByCat.keys()]);
  return [...categories]
    .map((category) => ({
      category: category as ExpenseCategory,
      monthlyLimit: limitByCat.has(category) ? round2(limitByCat.get(category)!) : null,
      spent: round2(spentByCat.get(category) ?? 0),
    }))
    .sort((a, b) => b.spent - a.spent);
}

/** Sets (or clears, when amount is 0) a category's monthly cap. */
export async function setCategoryBudget(userId: string, category: ExpenseCategory, amount: number): Promise<void> {
  if (amount <= 0) {
    await prisma.categoryBudget.deleteMany({ where: { userId, category } });
    return;
  }
  await prisma.categoryBudget.upsert({
    where: { userId_category: { userId, category } },
    update: { monthlyLimit: new Prisma.Decimal(amount) },
    create: { userId, category, monthlyLimit: new Prisma.Decimal(amount) },
  });
}

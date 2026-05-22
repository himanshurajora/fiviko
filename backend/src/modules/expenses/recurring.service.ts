import { prisma } from '../../lib/prisma.js';

/**
 * Generates this month's instances of a user's recurring expenses.
 *
 * Each distinct recurring expense (by category + amount + currency) is treated
 * as a template; if no instance exists for the current month, one is created
 * dated the 1st. Idempotent via a deterministic `clientId`, so re-running (or a
 * retried cron) never duplicates. Generated rows are written directly — they do
 * NOT advance the logging streak, since the user didn't actively log them.
 *
 * Returns the number of expenses created.
 */
export async function generateRecurringForUser(userId: string, when = new Date()): Promise<number> {
  const monthStart = new Date(Date.UTC(when.getUTCFullYear(), when.getUTCMonth(), 1));
  const monthKey = `${when.getUTCFullYear()}-${String(when.getUTCMonth() + 1).padStart(2, '0')}`;

  const recurring = await prisma.expense.findMany({
    where: { userId, isRecurring: true },
    orderBy: { date: 'desc' },
  });

  // Most-recent expense per signature is the template.
  const templates = new Map<string, (typeof recurring)[number]>();
  for (const e of recurring) {
    const sig = `${e.category}|${Number(e.amount)}|${e.currency}`;
    if (!templates.has(sig)) templates.set(sig, e);
  }

  let created = 0;
  for (const [sig, t] of templates) {
    // Skip if an instance for this signature already exists in the current month.
    const alreadyThisMonth = recurring.some(
      (e) => `${e.category}|${Number(e.amount)}|${e.currency}` === sig && e.date >= monthStart,
    );
    if (alreadyThisMonth) continue;

    const clientId = `rec:${t.category}:${Number(t.amount)}:${t.currency}:${monthKey}`;
    const existing = await prisma.expense.findUnique({ where: { userId_clientId: { userId, clientId } } });
    if (existing) continue;

    await prisma.expense.create({
      data: {
        userId,
        amount: t.amount,
        currency: t.currency,
        baseCurrencyAmount: t.baseCurrencyAmount,
        category: t.category,
        note: t.note,
        date: monthStart,
        paymentMethod: t.paymentMethod,
        isRecurring: true,
        needOrWant: t.needOrWant,
        clientId,
        syncStatus: 'SYNCED',
      },
    });
    created += 1;
  }
  return created;
}

/** Runs recurring generation for every user. Called by the scheduler. */
export async function generateRecurringForAllUsers(when = new Date()): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  let total = 0;
  for (const u of users) total += await generateRecurringForUser(u.id, when);
  return total;
}

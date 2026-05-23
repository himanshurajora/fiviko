import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Phase 1 badges (spec §14). `code` is the stable key used by unlock logic. */
const BADGES = [
  { code: 'ONBOARDING_COMPLETED', name: 'Onboarding Completed', description: 'Finished setting up your financial profile.', icon: '🎉', unlockCondition: 'Complete onboarding' },
  { code: 'FIRST_GOAL', name: 'First Goal Created', description: 'Created your very first purchase goal.', icon: '🎯', unlockCondition: 'Create 1 goal' },
  { code: 'FIRST_EXPENSE', name: 'First Expense Logged', description: 'Logged your first expense.', icon: '✍️', unlockCondition: 'Log 1 expense' },
  { code: 'SEVEN_DAY_SAVER', name: '7-Day Saver', description: 'Hit your saving target 7 days in a row.', icon: '💎', unlockCondition: 'Saving streak >= 7' },
  { code: 'BUDGET_DEFENDER', name: 'Budget Defender', description: 'Stayed under budget for a full week.', icon: '🛡️', unlockCondition: 'Under-budget streak >= 7' },
  { code: 'SMART_BUYER', name: 'Smart Buyer', description: 'Followed a Buy Now recommendation wisely.', icon: '🧠', unlockCondition: 'Complete a Buy Now goal' },
  { code: 'DEBT_FIGHTER', name: 'Debt Fighter', description: 'Reduced your total liabilities.', icon: '⚔️', unlockCondition: 'Reduce liabilities' },
  { code: 'EMERGENCY_FUND_STARTER', name: 'Emergency Fund Starter', description: 'Started building your emergency fund.', icon: '🚑', unlockCondition: 'Emergency fund health > 0.25' },
  { code: 'GOAL_ACHIEVER', name: 'Goal Achiever', description: 'Completed a savings goal.', icon: '🏆', unlockCondition: 'Achieve 1 goal' },
  { code: 'PRODUCTIVITY_INVESTOR', name: 'Productivity Investor', description: 'Invested in a high-productivity purchase.', icon: '⚡', unlockCondition: 'Buy a high-productivity goal' },
  { code: 'DREAM_PLANNER', name: 'Dream Planner', description: 'Created a long-term dream goal.', icon: '🌙', unlockCondition: 'Create a long-term goal' },
  // Money-hub badges (Phase 1.5) — see evaluateMoneyBadges.
  { code: 'INCOME_DIVERSIFIER', name: 'Income Diversifier', description: 'Tracked 3 or more active income sources.', icon: '🌳', unlockCondition: '3+ active incomes' },
  { code: 'INTERNATIONAL_INCOME', name: 'International Income', description: 'Earned in two or more currencies.', icon: '🌍', unlockCondition: '2+ currencies in income' },
  { code: 'DEBT_CRUSHER_HALF', name: 'Debt Crusher', description: 'Paid down a debt by half — momentum.', icon: '🛡️', unlockCondition: 'Liability ≥50% paid down' },
  { code: 'DEBT_CRUSHER_FULL', name: 'Debt Free', description: 'Wiped out an entire debt. Iron-clad.', icon: '🦾', unlockCondition: 'Liability 100% paid down' },
  { code: 'MULTI_ACCOUNT', name: 'Multi-Account', description: '3 accounts across at least 2 types — diversified.', icon: '🏛️', unlockCondition: '3+ accounts, 2+ types' },
];

/** Phase 1 challenges (spec §14). */
const CHALLENGES = [
  { code: 'DAILY_LOG', title: 'Log every expense today', description: 'Record all of today’s spending.', type: 'DAILY' as const, targetValue: 1, rewardBadgeCode: 'FIRST_EXPENSE' },
  { code: 'DAILY_NO_IMPULSE', title: 'No impulse buys today', description: 'Avoid any unplanned "want" purchases today.', type: 'DAILY' as const, targetValue: 1, rewardBadgeCode: null },
  { code: 'MONTHLY_UNDER_BUDGET', title: 'Stay under budget this month', description: 'Keep monthly spending within your safe limit.', type: 'MONTHLY' as const, targetValue: 1, rewardBadgeCode: 'BUDGET_DEFENDER' },
  { code: 'MONTHLY_SAVE_STREAK', title: 'Save for 7 days straight', description: 'Hit your daily saving target for a week.', type: 'MONTHLY' as const, targetValue: 7, rewardBadgeCode: 'SEVEN_DAY_SAVER' },
];

/** A small set of demo manual exchange rates (spec §5). Replace with a live API later. */
const CURRENCY_RATES = [
  { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
  { fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79 },
  { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.2 },
  { fromCurrency: 'USD', toCurrency: 'JPY', rate: 156.4 },
  { fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.52 },
  { fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.37 },
  { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09 },
  { fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.27 },
  { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012 },
];

async function main() {
  console.log('🌱 Seeding Fiviko...');

  for (const badge of BADGES) {
    await prisma.badge.upsert({ where: { code: badge.code }, update: badge, create: badge });
  }
  console.log(`  ✓ ${BADGES.length} badges`);

  for (const c of CHALLENGES) {
    const rewardBadge = c.rewardBadgeCode
      ? await prisma.badge.findUnique({ where: { code: c.rewardBadgeCode } })
      : null;
    const data = {
      code: c.code,
      title: c.title,
      description: c.description,
      type: c.type,
      targetValue: c.targetValue,
      rewardBadgeId: rewardBadge?.id ?? null,
    };
    await prisma.challenge.upsert({ where: { code: c.code }, update: data, create: data });
  }
  console.log(`  ✓ ${CHALLENGES.length} challenges`);

  for (const r of CURRENCY_RATES) {
    await prisma.currencyRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency: r.fromCurrency, toCurrency: r.toCurrency } },
      update: { rate: r.rate, source: 'seed' },
      create: { ...r, source: 'seed' },
    });
  }
  console.log(`  ✓ ${CURRENCY_RATES.length} currency rates`);

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());

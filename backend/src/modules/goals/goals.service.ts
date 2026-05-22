import { Prisma } from '@prisma/client';
import type { Goal, GoalRecommendation, GoalScoreInput } from '@prisma/client';
import {
  GoalStatus,
  type GoalCategory,
  type GoalDTO,
  type GoalScoreInputValues,
  type GoalType,
  type RecommendationResult,
} from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { convertCurrency } from '../../lib/currency.js';
import { getFinancialSummary } from '../profile/profile.service.js';
import { computeSavingsSplit, type SplitGoalInput } from '../scoring/savings-split.js';
import { awardBadge } from '../badges/badges.service.js';
import { scorePurchase, type CompetingGoal, type ScoringContext } from '../scoring/scoring.engine.js';
import type { CreateGoalInput, ScoreInput, UpdateGoalInput } from './goals.schema.js';

const dec = (d: Prisma.Decimal | number | null): number => (d == null ? 0 : Number(d));

type GoalWithRelations = Goal & {
  scoreInput?: GoalScoreInput | null;
  recommendation?: GoalRecommendation | null;
};

/** Normalise a persisted recommendation row back into the clean RecommendationResult shape. */
export function recommendationRowToResult(row: GoalRecommendation): RecommendationResult {
  const breakdown = (row.breakdown as { factors?: RecommendationResult['factors']; conflicts?: RecommendationResult['conflicts'] } | null) ?? {};
  return {
    purchaseReadinessScore: row.purchaseReadinessScore,
    financialSafetyScore: row.financialSafetyScore,
    personalValueScore: row.personalValueScore,
    futureBenefitScore: row.futureBenefitScore,
    riskScore: row.riskScore,
    goalConflictScore: row.goalConflictScore,
    recommendation: row.recommendation,
    safeBudgetMin: dec(row.safeBudgetMin),
    safeBudgetMax: dec(row.safeBudgetMax),
    recommendedPurchaseDate: row.recommendedPurchaseDate ? row.recommendedPurchaseDate.toISOString() : null,
    monthlySavingRequired: dec(row.monthlySavingRequired),
    explanation: row.explanation,
    factors: breakdown.factors ?? [],
    conflicts: breakdown.conflicts ?? [],
  };
}

export function toGoalDTO(goal: GoalWithRelations, extra?: { recommendedMonthlySaving?: number; estimatedCompletionDate?: string | null }): GoalDTO {
  return {
    id: goal.id,
    name: goal.name,
    type: goal.type as GoalType,
    category: goal.category as GoalCategory,
    targetAmount: dec(goal.targetAmount),
    currency: goal.currency,
    baseCurrencyTargetAmount: dec(goal.baseCurrencyTargetAmount),
    currentSavedAmount: dec(goal.currentSavedAmount),
    baseCurrencyCurrentSavedAmount: dec(goal.baseCurrencyCurrentSavedAmount),
    targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
    priority: goal.priority,
    expectedMaintenanceCost: goal.expectedMaintenanceCost != null ? dec(goal.expectedMaintenanceCost) : null,
    expectedResaleValue: goal.expectedResaleValue != null ? dec(goal.expectedResaleValue) : null,
    isReplacingExistingItem: goal.isReplacingExistingItem,
    status: goal.status,
    notes: goal.notes,
    recommendation: goal.recommendation?.recommendation,
    recommendedMonthlySaving: extra?.recommendedMonthlySaving,
    estimatedCompletionDate: extra?.estimatedCompletionDate,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

export async function createGoal(userId: string, input: CreateGoalInput): Promise<GoalDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  const baseTarget = await convertCurrency(input.targetAmount, input.currency, user.baseCurrency);
  const baseSaved = await convertCurrency(input.currentSavedAmount, input.currency, user.baseCurrency);

  const goal = await prisma.goal.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      category: input.category,
      targetAmount: new Prisma.Decimal(input.targetAmount),
      currency: input.currency,
      baseCurrencyTargetAmount: new Prisma.Decimal(baseTarget),
      currentSavedAmount: new Prisma.Decimal(input.currentSavedAmount),
      baseCurrencyCurrentSavedAmount: new Prisma.Decimal(baseSaved),
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      priority: input.priority,
      expectedMaintenanceCost: input.expectedMaintenanceCost != null ? new Prisma.Decimal(input.expectedMaintenanceCost) : null,
      expectedResaleValue: input.expectedResaleValue != null ? new Prisma.Decimal(input.expectedResaleValue) : null,
      isReplacingExistingItem: input.isReplacingExistingItem,
      notes: input.notes ?? null,
    },
  });
  // Unlock the "First Goal Created" badge (idempotent), plus a dream-planner
  // badge for long-term goals.
  await awardBadge(userId, 'FIRST_GOAL');
  if (input.type === 'LONG_TERM') await awardBadge(userId, 'DREAM_PLANNER');
  // A new goal changes the competing set for every other goal.
  await recomputeActiveGoals(userId);
  return toGoalDTO(goal);
}

/** Lists a user's goals enriched with their auto savings-split allocation. */
export async function listGoals(userId: string): Promise<GoalDTO[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { scoreInput: true, recommendation: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  const summary = await getFinancialSummary(userId);
  const split = computeSavingsSplit(summary, goals.map(toSplitInput));
  const allocationByGoal = new Map(split.allocations.map((a) => [a.goalId, a]));

  return goals.map((g) => {
    const alloc = allocationByGoal.get(g.id);
    return toGoalDTO(g, {
      recommendedMonthlySaving: alloc?.monthlyAllocation,
      estimatedCompletionDate: alloc?.estimatedCompletionDate ?? null,
    });
  });
}

export async function getGoal(userId: string, goalId: string): Promise<GoalWithRelations> {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: { scoreInput: true, recommendation: true },
  });
  if (!goal) throw AppError.notFound('Goal not found');
  return goal;
}

export async function updateGoal(userId: string, goalId: string, input: UpdateGoalInput): Promise<GoalDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  await getGoal(userId, goalId); // ownership check

  const data: Prisma.GoalUpdateInput = {};
  const currency = input.currency;
  if (input.name !== undefined) data.name = input.name;
  if (input.type !== undefined) data.type = input.type;
  if (input.category !== undefined) data.category = input.category;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.isReplacingExistingItem !== undefined) data.isReplacingExistingItem = input.isReplacingExistingItem;
  if (input.targetDate !== undefined) data.targetDate = input.targetDate ? new Date(input.targetDate) : null;
  if (input.expectedMaintenanceCost !== undefined)
    data.expectedMaintenanceCost = input.expectedMaintenanceCost != null ? new Prisma.Decimal(input.expectedMaintenanceCost) : null;
  if (input.expectedResaleValue !== undefined)
    data.expectedResaleValue = input.expectedResaleValue != null ? new Prisma.Decimal(input.expectedResaleValue) : null;
  if (currency !== undefined) data.currency = currency;

  if (input.targetAmount !== undefined) {
    data.targetAmount = new Prisma.Decimal(input.targetAmount);
    const cur = currency ?? (await getGoal(userId, goalId)).currency;
    data.baseCurrencyTargetAmount = new Prisma.Decimal(await convertCurrency(input.targetAmount, cur, user.baseCurrency));
  }
  if (input.currentSavedAmount !== undefined) {
    data.currentSavedAmount = new Prisma.Decimal(input.currentSavedAmount);
    const cur = currency ?? (await getGoal(userId, goalId)).currency;
    data.baseCurrencyCurrentSavedAmount = new Prisma.Decimal(await convertCurrency(input.currentSavedAmount, cur, user.baseCurrency));
  }

  const goal = await prisma.goal.update({ where: { id: goalId }, data, include: { recommendation: true } });
  // Re-score this goal and all others (target/saved/priority changes ripple out).
  await recomputeActiveGoals(userId);
  return toGoalDTO(goal);
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  await getGoal(userId, goalId);
  await prisma.goal.delete({ where: { id: goalId } });
  // Removing a goal frees up the savings pool for the rest.
  await recomputeActiveGoals(userId);
}

/**
 * Records actual savings put toward a goal (in the goal's currency): increases
 * the saved amount, marks the goal achieved when it reaches the target (awarding
 * the Goal Achiever badge), and recomputes the savings split for the rest.
 */
export async function contributeToGoal(userId: string, goalId: string, amount: number, fromAssetId?: string | null): Promise<GoalDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  const goal = await getGoal(userId, goalId);
  if (amount <= 0) throw AppError.badRequest('Contribution must be greater than 0');

  const baseAmount = await convertCurrency(amount, goal.currency, user.baseCurrency);

  // Optionally move the money out of a real asset so net worth stays consistent.
  if (fromAssetId) {
    const asset = await prisma.asset.findFirst({ where: { id: fromAssetId, userId } });
    if (!asset) throw AppError.badRequest('Source account not found');
    const oldBase = dec(asset.baseCurrencyAmount);
    if (baseAmount > oldBase) throw AppError.badRequest('Not enough in that account for this contribution');
    const newBase = oldBase - baseAmount;
    // Scale the asset's native amount proportionally (avoids a re-conversion).
    const ratio = oldBase > 0 ? newBase / oldBase : 0;
    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        baseCurrencyAmount: new Prisma.Decimal(round2(newBase)),
        amount: new Prisma.Decimal(round2(dec(asset.amount) * ratio)),
      },
    });
  }

  const newSaved = dec(goal.currentSavedAmount) + amount;
  const newBaseSaved = dec(goal.baseCurrencyCurrentSavedAmount) + baseAmount;
  const reachedTarget = newBaseSaved >= dec(goal.baseCurrencyTargetAmount);

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      currentSavedAmount: new Prisma.Decimal(newSaved),
      baseCurrencyCurrentSavedAmount: new Prisma.Decimal(newBaseSaved),
      status: reachedTarget ? GoalStatus.Achieved : goal.status,
    },
    include: { recommendation: true },
  });

  if (reachedTarget) await awardBadge(userId, 'GOAL_ACHIEVER');
  // Saved money (and possibly liquidity) changed → re-split across active goals.
  await recomputeActiveGoals(userId);
  return toGoalDTO(updated);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function saveScoreInput(userId: string, goalId: string, input: ScoreInput): Promise<void> {
  await getGoal(userId, goalId);
  await prisma.goalScoreInput.upsert({
    where: { goalId },
    update: input,
    create: { goalId, ...input },
  });
  await recomputeActiveGoals(userId);
}

/**
 * Recomputes and persists the recommendation for EVERY active scored goal in one
 * consistent pass. This is the single source of truth: it computes the savings
 * split once, then scores each goal against the same financial picture and the
 * same competing-goal allocations — so editing one goal (or the user's finances)
 * is automatically reflected across all of them. Safe to call after any change.
 */
export async function recomputeActiveGoals(userId: string): Promise<void> {
  const summary = await getFinancialSummary(userId);
  const activeGoals = await prisma.goal.findMany({
    where: { userId, status: GoalStatus.Active },
    include: { scoreInput: true },
  });
  const split = computeSavingsSplit(summary, activeGoals.map(toSplitInput));
  const allocByGoal = new Map(split.allocations.map((a) => [a.goalId, a.monthlyAllocation]));

  await Promise.all(
    activeGoals.map(async (goal) => {
      const ctx = buildContext(goal, activeGoals, summary, split.monthlySavingsPool, allocByGoal);
      if (!ctx) return; // not yet scored
      const result = scorePurchase(ctx);
      await prisma.goalRecommendation.upsert({
        where: { goalId: goal.id },
        update: toRecommendationData(result),
        create: { goalId: goal.id, ...toRecommendationData(result) },
      });
    }),
  );
}

/** Recomputes all goals, then returns the freshly-stored recommendation for one. */
export async function recalculateRecommendation(userId: string, goalId: string): Promise<RecommendationResult> {
  const goal = await getGoal(userId, goalId);
  if (!goal.scoreInput) throw AppError.badRequest('Answer the goal value questions before calculating a recommendation', { scoreInput: ['Score inputs are required'] });
  await recomputeActiveGoals(userId);
  const updated = await prisma.goalRecommendation.findUnique({ where: { goalId } });
  if (!updated) throw AppError.badRequest('Could not compute a recommendation');
  return recommendationRowToResult(updated);
}

/** What-if: score with an optional price override, without persisting (spec §15). */
export async function simulateWhatIf(userId: string, goalId: string, overrideTargetAmount?: number): Promise<RecommendationResult> {
  const ctx = await buildScoringContext(userId, goalId);
  if (!ctx) throw AppError.badRequest('Answer the goal value questions before simulating', { scoreInput: ['Score inputs are required'] });
  if (overrideTargetAmount != null) ctx.targetAmount = overrideTargetAmount;
  return scorePurchase(ctx);
}

// --- helpers --------------------------------------------------------------

const remainingOf = (g: Goal): number =>
  Math.max(0, dec(g.baseCurrencyTargetAmount) - dec(g.baseCurrencyCurrentSavedAmount));

function toSplitInput(g: Goal & { scoreInput?: GoalScoreInput | null }): SplitGoalInput {
  return {
    id: g.id,
    name: g.name,
    category: g.category,
    priority: g.priority,
    remaining: remainingOf(g),
    scores: g.scoreInput ? extractScores(g.scoreInput) : null,
  };
}

/** Pure context builder shared by recompute (batch) and what-if (single). */
function buildContext(
  goal: Goal & { scoreInput?: GoalScoreInput | null },
  activeGoals: (Goal & { scoreInput?: GoalScoreInput | null })[],
  summary: Awaited<ReturnType<typeof getFinancialSummary>>,
  monthlySavingsPool: number,
  allocByGoal: Map<string, number>,
): ScoringContext | null {
  if (!goal.scoreInput) return null;
  const competingGoals: CompetingGoal[] = activeGoals
    .filter((g) => g.id !== goal.id)
    .map((g) => ({ id: g.id, name: g.name, remaining: remainingOf(g), allocatedMonthly: allocByGoal.get(g.id) ?? 0 }))
    .filter((g) => g.remaining > 0);

  return {
    summary,
    scores: extractScores(goal.scoreInput),
    targetAmount: dec(goal.baseCurrencyTargetAmount),
    currentSaved: dec(goal.baseCurrencyCurrentSavedAmount),
    category: goal.category as GoalCategory,
    goalType: goal.type as GoalType,
    targetDate: goal.targetDate,
    monthlySavingsPool,
    allocatedMonthly: allocByGoal.get(goal.id) ?? 0,
    monthlyMaintenanceCost: goal.expectedMaintenanceCost != null ? dec(goal.expectedMaintenanceCost) : 0,
    competingGoals,
  };
}

function extractScores(s: GoalScoreInput): GoalScoreInputValues {
  return {
    incomeImpact: s.incomeImpact,
    productivity: s.productivity,
    happiness: s.happiness,
    necessity: s.necessity,
    urgency: s.urgency,
    dreamLuxury: s.dreamLuxury,
    timeSaving: s.timeSaving,
    frequencyOfUse: s.frequencyOfUse,
    careerGrowth: s.careerGrowth,
    healthWellbeing: s.healthWellbeing,
    familySocialImpact: s.familySocialImpact,
    regretRisk: s.regretRisk,
    maintenanceBurden: s.maintenanceBurden,
  };
}

/** Assembles the context for a single goal (used by what-if). Null if unscored. */
async function buildScoringContext(userId: string, goalId: string): Promise<ScoringContext | null> {
  const goal = await getGoal(userId, goalId);
  if (!goal.scoreInput) return null;

  const summary = await getFinancialSummary(userId);
  const activeGoals = await prisma.goal.findMany({
    where: { userId, status: GoalStatus.Active },
    include: { scoreInput: true },
  });
  const split = computeSavingsSplit(summary, activeGoals.map(toSplitInput));
  const allocByGoal = new Map(split.allocations.map((a) => [a.goalId, a.monthlyAllocation]));

  // The current goal may itself be inactive/edge — find it in the active list or use as-is.
  const target = activeGoals.find((g) => g.id === goalId) ?? goal;
  return buildContext(target, activeGoals, summary, split.monthlySavingsPool, allocByGoal);
}

function toRecommendationData(r: RecommendationResult) {
  return {
    purchaseReadinessScore: r.purchaseReadinessScore,
    financialSafetyScore: r.financialSafetyScore,
    personalValueScore: r.personalValueScore,
    futureBenefitScore: r.futureBenefitScore,
    riskScore: r.riskScore,
    goalConflictScore: r.goalConflictScore,
    recommendation: r.recommendation,
    safeBudgetMin: new Prisma.Decimal(r.safeBudgetMin),
    safeBudgetMax: new Prisma.Decimal(r.safeBudgetMax),
    recommendedPurchaseDate: r.recommendedPurchaseDate ? new Date(r.recommendedPurchaseDate) : null,
    monthlySavingRequired: new Prisma.Decimal(r.monthlySavingRequired),
    explanation: r.explanation,
    breakdown: { factors: r.factors, conflicts: r.conflicts } as unknown as Prisma.InputJsonValue,
  };
}

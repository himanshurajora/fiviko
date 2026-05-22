import {
  ExpenseCategory,
  GoalCategory,
  GoalPriority,
  GoalType,
  NeedOrWant,
  SCORE_QUESTIONS,
  CATEGORY_SCORE_PRESETS,
  type GoalScoreInputValues,
} from '@fiviko/shared';
import { AppError } from '../../lib/http.js';
import { chat, chatJson, COACH_SYSTEM } from '../../lib/openai.js';
import { prisma } from '../../lib/prisma.js';
import { buildFinancialContext } from './ai.context.js';
import { getGoal, recommendationRowToResult } from '../goals/goals.service.js';

export interface AiResult {
  text: string;
  cached: boolean;
}

// --- Cost controls --------------------------------------------------------

/** Simple in-memory TTL cache for the expensive, infrequent generations. */
const cache = new Map<string, { text: string; expires: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h

function getCached(key: string): string | null {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.text;
  if (hit) cache.delete(key);
  return null;
}
function setCached(key: string, text: string): void {
  cache.set(key, { text, expires: Date.now() + CACHE_TTL_MS });
}

/** Per-user sliding-window rate limit across all AI calls (cost guard). */
const calls = new Map<string, number[]>();
const RATE_LIMIT = 20; // calls
const RATE_WINDOW_MS = 1000 * 60 * 60; // per hour

function enforceRateLimit(userId: string): void {
  const now = Date.now();
  const recent = (calls.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    throw new AppError(429, 'You’ve reached the hourly AI limit — please try again later', 'AI_RATE_LIMITED');
  }
  recent.push(now);
  calls.set(userId, recent);
}

function monthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// --- Features -------------------------------------------------------------

/** A personalized summary of the month. Cached per user+month (regenerate=force). */
export async function monthlyReport(userId: string, regenerate = false): Promise<AiResult> {
  const key = `report:${userId}:${monthKey()}`;
  if (!regenerate) {
    const cached = getCached(key);
    if (cached) return { text: cached, cached: true };
  }
  enforceRateLimit(userId);
  const context = await buildFinancialContext(userId);
  const text = await chat(
    COACH_SYSTEM,
    `Write this month's money report for the user. Cover: how spending went vs budget, ` +
      `progress on goals, one or two wins to celebrate, and 2-3 specific, actionable tips. ` +
      `Use a friendly tone with short sections.\n\nDATA:\n${context}`,
    550,
  );
  setCached(key, text);
  return { text, cached: false };
}

/** Tailored savings tips. Cached per user+month. */
export async function savingsTips(userId: string, regenerate = false): Promise<AiResult> {
  const key = `tips:${userId}:${monthKey()}`;
  if (!regenerate) {
    const cached = getCached(key);
    if (cached) return { text: cached, cached: true };
  }
  enforceRateLimit(userId);
  const context = await buildFinancialContext(userId);
  const text = await chat(
    COACH_SYSTEM,
    `Give 3 short, specific, prioritized savings tips for this user as a bullet list. ` +
      `Tie each tip to their actual numbers.\n\nDATA:\n${context}`,
    350,
  );
  setCached(key, text);
  return { text, cached: false };
}

/** Free-form Q&A grounded in the user's finances (not cached; rate-limited). */
export async function coachAsk(userId: string, question: string): Promise<AiResult> {
  const trimmed = question.trim();
  if (trimmed.length < 3) throw AppError.badRequest('Please ask a fuller question');
  if (trimmed.length > 500) throw AppError.badRequest('Question is too long');
  enforceRateLimit(userId);
  const context = await buildFinancialContext(userId);
  const text = await chat(
    COACH_SYSTEM,
    `The user asks: "${trimmed}"\n\nAnswer using their data below. If their question needs ` +
      `data you don't have, say so briefly.\n\nDATA:\n${context}`,
    450,
  );
  return { text, cached: false };
}

/** A richer plain-language explanation of one goal's purchase recommendation. */
export async function explainDecision(userId: string, goalId: string): Promise<AiResult> {
  const goal = await getGoal(userId, goalId);
  if (!goal.recommendation) throw AppError.badRequest('This goal has no recommendation yet');
  const rec = recommendationRowToResult(goal.recommendation);
  const key = `explain:${goalId}:${Math.round(rec.purchaseReadinessScore)}`;
  const cached = getCached(key);
  if (cached) return { text: cached, cached: true };

  enforceRateLimit(userId);
  const context = await buildFinancialContext(userId);
  const factors = rec.factors.map((f) => `${f.label}: ${f.impact > 0 ? '+' : ''}${f.impact}`).join(', ');
  const conflicts = rec.conflicts.map((c) => `${c.goalName} delayed ~${c.delayMonths}mo`).join('; ') || 'none';
  const text = await chat(
    COACH_SYSTEM,
    `Explain, in friendly plain language, why buying "${goal.name}" got the recommendation ` +
      `"${rec.recommendation}" (readiness ${Math.round(rec.purchaseReadinessScore)}/100). ` +
      `Reference the biggest factors and what would change the verdict. Keep it to ~120 words.\n\n` +
      `FACTORS: ${factors}\nCONFLICTS: ${conflicts}\nSUMMARY:\n${context}`,
    350,
  );
  setCached(key, text);
  return { text, cached: false };
}

// --- Structured parsing (voice expense, goal autoconfig) ------------------

const clamp100 = (n: unknown): number => Math.max(1, Math.min(100, Math.round(Number(n) || 50)));
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(String(v)) ? (v as T) : fallback;

export interface ParsedExpense {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note: string | null;
  needOrWant: NeedOrWant;
}

/** Turns a free-text / spoken phrase ("spent 12 euros on lunch") into an expense draft. */
export async function parseExpenseText(userId: string, text: string): Promise<ParsedExpense> {
  const trimmed = text.trim();
  if (trimmed.length < 2) throw AppError.badRequest('Please say or type what you spent');
  enforceRateLimit(userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { baseCurrency: true } });
  const baseCurrency = user?.baseCurrency ?? 'USD';

  const categories = Object.values(ExpenseCategory).join(', ');
  const parsed = await chatJson<Partial<ParsedExpense>>(
    'You extract a single expense from the user phrase and return strict JSON. ' +
      `Fields: amount (number), currency (3-letter, default ${baseCurrency}), ` +
      `category (one of: ${categories}), note (short string or null), needOrWant ("NEED" or "WANT"). ` +
      'Infer the category sensibly. If no amount is stated, set amount to 0.',
    `Phrase: "${trimmed}"`,
    200,
  );

  const amount = Number(parsed.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw AppError.badRequest('Couldn’t catch an amount — try “spent 12 on coffee”');
  return {
    amount: Math.round(amount * 100) / 100,
    currency: typeof parsed.currency === 'string' && parsed.currency.length === 3 ? parsed.currency.toUpperCase() : baseCurrency,
    category: oneOf(parsed.category, Object.values(ExpenseCategory), ExpenseCategory.Other),
    note: typeof parsed.note === 'string' && parsed.note.trim() ? parsed.note.trim().slice(0, 120) : null,
    needOrWant: oneOf(parsed.needOrWant, Object.values(NeedOrWant), NeedOrWant.Need),
  };
}

export interface ConfiguredGoal {
  name: string;
  category: GoalCategory;
  type: GoalType;
  targetAmount: number;
  priority: GoalPriority;
  scores: GoalScoreInputValues;
}

/** Turns a description ("a reliable used car for my commute, ~8000") into a goal draft. */
export async function configureGoalFromText(userId: string, description: string): Promise<ConfiguredGoal> {
  const trimmed = description.trim();
  if (trimmed.length < 3) throw AppError.badRequest('Tell me a bit about the goal');
  enforceRateLimit(userId);

  const categories = Object.values(GoalCategory).join(', ');
  const scoreKeys = SCORE_QUESTIONS.map((q) => q.key).join(', ');
  const parsed = await chatJson<Record<string, unknown>>(
    'You configure a savings goal from the user description and return strict JSON. Fields: ' +
      `name (short string), category (one of: ${categories}), type ("SHORT_TERM" or "LONG_TERM"), ` +
      'targetAmount (number, your best estimate of cost, 0 if unknown), priority ("LOW"|"MEDIUM"|"HIGH"), ' +
      `and scores: an object with these 1-100 keys: ${scoreKeys}. ` +
      'Set scores to reflect how this goal typically rates (e.g. a work laptop: high productivity/income, low luxury).',
    `Description: "${trimmed}"`,
    400,
  );

  const category = oneOf(parsed.category, Object.values(GoalCategory), GoalCategory.Other);
  const preset = CATEGORY_SCORE_PRESETS[category] ?? CATEGORY_SCORE_PRESETS.OTHER;
  const rawScores = (parsed.scores ?? {}) as Record<string, unknown>;
  const scores = Object.fromEntries(
    SCORE_QUESTIONS.map((q) => [q.key, rawScores[q.key] != null ? clamp100(rawScores[q.key]) : preset[q.key]]),
  ) as unknown as GoalScoreInputValues;

  return {
    name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim().slice(0, 80) : trimmed.slice(0, 60),
    category,
    type: oneOf(parsed.type, Object.values(GoalType), GoalType.ShortTerm),
    targetAmount: Math.max(0, Math.round(Number(parsed.targetAmount) || 0)),
    priority: oneOf(parsed.priority, Object.values(GoalPriority), GoalPriority.Medium),
    scores,
  };
}

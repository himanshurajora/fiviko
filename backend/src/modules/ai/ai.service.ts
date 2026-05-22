import { AppError } from '../../lib/http.js';
import { chat, COACH_SYSTEM } from '../../lib/openai.js';
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

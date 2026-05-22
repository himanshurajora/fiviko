import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from './http.js';

let client: OpenAI | null = null;

export function isAiEnabled(): boolean {
  return !!env.OPENAI_API_KEY;
}

function getClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new AppError(503, 'AI features are not configured on this server', 'AI_DISABLED');
  }
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

/**
 * One place for all OpenAI calls. Keeps responses short (cost control), pins a
 * cheap model by default, and frames the assistant as Fiviko's coach — strictly
 * using the user data we pass in, never inventing figures or giving licensed advice.
 */
export async function chat(system: string, user: string, maxTokens = 450): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: env.OPENAI_MODEL,
    max_tokens: maxTokens,
    temperature: 0.6,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? '';
}

/** Like {@link chat} but forces a JSON object response (for structured parsing). */
export async function chatJson<T>(system: string, user: string, maxTokens = 300): Promise<T> {
  const completion = await getClient().chat.completions.create({
    model: env.OPENAI_MODEL,
    max_tokens: maxTokens,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim() ?? '{}';
  return JSON.parse(text) as T;
}

export const COACH_SYSTEM = [
  'You are Fiviko, a warm, encouraging personal-money coach inside a budgeting app.',
  'Use ONLY the financial data provided in the user message; never invent numbers.',
  'Be concise, concrete and friendly. Prefer short paragraphs or tight bullet points.',
  'You provide educational guidance, NOT licensed financial, tax, or legal advice — never claim otherwise.',
  'Avoid disclaimers longer than one short sentence, and only when truly warranted.',
].join(' ');

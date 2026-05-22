import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  MAIN_API_URL: z.string().url().default('http://localhost:4000'),
  INTERNAL_API_TOKEN: z.string().min(8),
  CURRENCY_LAYER_API_KEY: z.string().optional(),
  CURRENCY_MIN_INTERVAL_HOURS: z.coerce.number().default(24),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ task-executor: invalid configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

/** The base-currency set we keep rates for (must mirror the app's currencies). */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'] as const;

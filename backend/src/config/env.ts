import 'dotenv/config';
import { z } from 'zod';

/** Validates process.env once at startup so misconfiguration fails fast and loud. */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  /**
   * Shared secret the task executor presents on /api/internal/* endpoints. The
   * executor never touches the DB directly — it calls these endpoints. Override
   * in production; the dev default keeps local boot working.
   */
  INTERNAL_API_TOKEN: z.string().min(16).default('dev-internal-token-change-me-please'),
  /** OpenAI — optional; AI features disable gracefully when unset. */
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  /** Legacy in-process scheduler. Off by default now that the executor owns jobs. */
  ENABLE_SCHEDULER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((o) => o.trim()),
  isProduction: parsed.data.NODE_ENV === 'production',
};

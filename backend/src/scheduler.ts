import { env } from './config/env.js';

/**
 * Scheduled jobs (recurring expenses, income/net-worth snapshots, currency sync)
 * now run in the dedicated **task-executor** service, which triggers them via the
 * authenticated /api/internal/* endpoints. This keeps scheduling out of the API
 * process so it can scale independently, and the executor never touches the DB.
 *
 * The in-process path remains only as an optional fallback (ENABLE_SCHEDULER=true)
 * and is a no-op by default.
 */
export function startScheduler(): void {
  if (!env.ENABLE_SCHEDULER) {
    console.log('🛰️  Scheduled jobs are handled by the task-executor service.');
    return;
  }
  console.log('⚠️  ENABLE_SCHEDULER=true, but in-process scheduling is deprecated — run the task-executor instead.');
}

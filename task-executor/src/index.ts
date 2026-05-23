import cron from 'node-cron';
import { config } from './config.js';
import { currencySyncJob, dailyNetWorthSnapshotJob, monthlyAutoDepositJob, monthlyIncomeJob, recurringExpensesJob } from './jobs.js';

/**
 * Fiviko task executor — a standalone scheduler that drives periodic work by
 * calling the main server's authenticated /api/internal/* endpoints. It holds
 * no database connection: all reads/writes go through the API.
 *
 * Schedule (UTC):
 *  - Currency sync: hourly heartbeat, but the server's lastRunAt guard limits
 *    the real currencylayer fetch to at most once per CURRENCY_MIN_INTERVAL_HOURS.
 *  - Net-worth snapshot: every day at 02:05 — so the chart shows FX drift even
 *    on days the user doesn't log anything.
 *  - Recurring expenses + monthly income snapshot: 02:00 on the 1st of each month.
 */
async function main(): Promise<void> {
  console.log(`🛠️  Fiviko task-executor starting — target ${config.MAIN_API_URL}`);

  // Populate the DB on first boot (all are guarded/idempotent on the server).
  await currencySyncJob();
  await dailyNetWorthSnapshotJob();

  cron.schedule('0 * * * *', () => void currencySyncJob(), { timezone: 'UTC' });
  cron.schedule('5 2 * * *', () => void dailyNetWorthSnapshotJob(), { timezone: 'UTC' });
  cron.schedule(
    '0 2 1 * *',
    () => {
      void recurringExpensesJob();
      void monthlyIncomeJob();
      // Auto-credit salaries into each user's designated bank account. Server-
      // side idempotency (lastDepositedMonth) makes retries safe.
      void monthlyAutoDepositJob();
    },
    { timezone: 'UTC' },
  );

  console.log('⏰ task-executor schedules registered (currency hourly; net-worth daily; recurring + income + auto-deposit monthly).');
}

main().catch((err) => {
  console.error('task-executor failed to start:', err);
  process.exit(1);
});

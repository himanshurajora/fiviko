import cron from 'node-cron';
import { config } from './config.js';
import { currencySyncJob, monthlySnapshotsJob, recurringExpensesJob } from './jobs.js';

/**
 * Fiviko task executor — a standalone scheduler that drives periodic work by
 * calling the main server's authenticated /api/internal/* endpoints. It holds
 * no database connection: all reads/writes go through the API.
 *
 * Schedule:
 *  - Currency sync: hourly heartbeat, but the server's lastRunAt guard limits
 *    the real currencylayer fetch to at most once per CURRENCY_MIN_INTERVAL_HOURS.
 *  - Recurring expenses + monthly snapshots: 02:00 UTC on the 1st of each month.
 */
async function main(): Promise<void> {
  console.log(`🛠️  Fiviko task-executor starting — target ${config.MAIN_API_URL}`);

  // Populate the DB on first boot (guarded server-side, so safe to call always).
  await currencySyncJob();

  // Heartbeat: check hourly; the server decides whether an actual fetch is due.
  cron.schedule('0 * * * *', () => void currencySyncJob(), { timezone: 'UTC' });

  // Monthly jobs at 02:00 UTC on the 1st.
  cron.schedule(
    '0 2 1 * *',
    () => {
      void recurringExpensesJob();
      void monthlySnapshotsJob();
    },
    { timezone: 'UTC' },
  );

  console.log('⏰ task-executor schedules registered (currency hourly-guarded; monthly jobs on the 1st).');
}

main().catch((err) => {
  console.error('task-executor failed to start:', err);
  process.exit(1);
});

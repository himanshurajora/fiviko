import cron from 'node-cron';
import { env } from './config/env.js';
import { generateRecurringForAllUsers } from './modules/expenses/recurring.service.js';
import { monthKey, snapshotMonthForAllUsers } from './modules/income-history/income-history.service.js';

/**
 * Optional in-process scheduler. Phase 1 only needs one genuine wall-clock job:
 * generating recurring expenses at the start of each month. Kept in-process (no
 * separate worker) and idempotent, so a missed/retried run never duplicates.
 *
 * When Phase 2 adds push notifications and reminders, this is the seam to lift
 * into a dedicated queue-backed worker (e.g. BullMQ + Redis).
 */
export function startScheduler(): void {
  if (!env.ENABLE_SCHEDULER) {
    console.log('⏸️  Scheduler disabled (ENABLE_SCHEDULER=false).');
    return;
  }

  // 02:00 UTC on the 1st of every month: generate recurring expenses and
  // snapshot each user's income for the new month (idempotent).
  cron.schedule(
    '0 2 1 * *',
    () => {
      void generateRecurringForAllUsers()
        .then((n) => console.log(`🔁 Recurring expenses generated: ${n}`))
        .catch((err) => console.error('Recurring generation failed:', err));
      void snapshotMonthForAllUsers(monthKey(new Date()))
        .then((n) => console.log(`📸 Income snapshots created: ${n}`))
        .catch((err) => console.error('Income snapshot failed:', err));
    },
    { timezone: 'UTC' },
  );

  console.log('⏰ Scheduler started (recurring expenses + income snapshots: monthly).');
}

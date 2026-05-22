import { config } from './config.js';
import { mainApi } from './mainApi.js';
import { fetchCurrencyRates } from './currencylayer.js';

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

/**
 * Syncs currency rates — but only if the server says one is due (it owns the
 * lastRunAt guard), so we never exceed the currencylayer monthly quota.
 */
export async function currencySyncJob(): Promise<void> {
  try {
    const { shouldSync, lastRunAt } = await mainApi.currencyShouldSync(config.CURRENCY_MIN_INTERVAL_HOURS);
    if (!shouldSync) {
      log(`💱 Currency sync skipped (last run ${lastRunAt}).`);
      return;
    }
    if (!config.CURRENCY_LAYER_API_KEY) {
      log('💱 Currency sync due but CURRENCY_LAYER_API_KEY not set — skipping.');
      return;
    }
    const rates = await fetchCurrencyRates();
    const { applied } = await mainApi.applyCurrencyRates(rates, 'currencylayer');
    log(`💱 Currency sync done — ${applied} rates applied.`);
  } catch (err) {
    log(`💱 Currency sync failed: ${(err as Error).message}`);
  }
}

export async function recurringExpensesJob(): Promise<void> {
  try {
    const { created } = await mainApi.runRecurringExpenses();
    log(`🔁 Recurring expenses generated: ${created}.`);
  } catch (err) {
    log(`🔁 Recurring expenses failed: ${(err as Error).message}`);
  }
}

export async function monthlySnapshotsJob(): Promise<void> {
  try {
    const income = await mainApi.runIncomeSnapshot();
    const networth = await mainApi.runNetWorthSnapshot();
    log(`📸 Monthly snapshots — income: ${income.created}, net worth: ${networth.snapshotted}.`);
  } catch (err) {
    log(`📸 Monthly snapshots failed: ${(err as Error).message}`);
  }
}

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

/** Monthly: income snapshot (recurring-income-as-history is monthly). */
export async function monthlyIncomeJob(): Promise<void> {
  try {
    const income = await mainApi.runIncomeSnapshot();
    log(`📸 Income snapshots — ${income.created}.`);
  } catch (err) {
    log(`📸 Income snapshot failed: ${(err as Error).message}`);
  }
}

/** Daily: net-worth snapshot so the chart reflects FX drift on no-update days. */
export async function dailyNetWorthSnapshotJob(): Promise<void> {
  try {
    const networth = await mainApi.runNetWorthSnapshot();
    log(`📸 Net-worth snapshots — ${networth.snapshotted}.`);
  } catch (err) {
    log(`📸 Net-worth snapshot failed: ${(err as Error).message}`);
  }
}

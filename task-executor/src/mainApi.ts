import axios from 'axios';
import { config } from './config.js';

/**
 * Thin client over the main server's /api/internal/* endpoints. This is the
 * executor's ONLY data access — it has no database connection of its own.
 */
const client = axios.create({
  baseURL: `${config.MAIN_API_URL}/api/internal`,
  headers: { 'x-internal-token': config.INTERNAL_API_TOKEN },
  timeout: 20_000,
});

export interface RateInput {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

export const mainApi = {
  async currencyShouldSync(minIntervalHours: number): Promise<{ shouldSync: boolean; lastRunAt: string | null }> {
    const { data } = await client.get('/currency/should-sync', { params: { minIntervalHours } });
    return data;
  },
  async applyCurrencyRates(rates: RateInput[], source: string): Promise<{ applied: number }> {
    const { data } = await client.post('/currency/rates', { rates, source });
    return data;
  },
  async runRecurringExpenses(): Promise<{ created: number }> {
    const { data } = await client.post('/jobs/recurring-expenses');
    return data;
  },
  async runIncomeSnapshot(): Promise<{ created: number }> {
    const { data } = await client.post('/jobs/income-snapshot');
    return data;
  },
  async runNetWorthSnapshot(): Promise<{ snapshotted: number }> {
    const { data } = await client.post('/jobs/networth-snapshot');
    return data;
  },
  async runAutoDeposits(): Promise<{ credited: number }> {
    const { data } = await client.post('/jobs/auto-deposit');
    return data;
  },
};

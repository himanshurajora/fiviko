import axios from 'axios';
import { config, SUPPORTED_CURRENCIES } from './config.js';
import type { RateInput } from './mainApi.js';

/**
 * Fetches live rates from currencylayer (free tier: USD source, http only).
 * Returns USD->X pairs for every supported currency; the main server's
 * converter triangulates other pairs through USD, so this is sufficient.
 */
export async function fetchCurrencyRates(): Promise<RateInput[]> {
  if (!config.CURRENCY_LAYER_API_KEY) {
    throw new Error('CURRENCY_LAYER_API_KEY is not set');
  }

  const currencies = SUPPORTED_CURRENCIES.filter((c) => c !== 'USD').join(',');
  const { data } = await axios.get('http://apilayer.net/api/live', {
    params: { access_key: config.CURRENCY_LAYER_API_KEY, source: 'USD', currencies, format: 1 },
    timeout: 20_000,
  });

  if (!data?.success) {
    const info = data?.error?.info ?? 'unknown error';
    throw new Error(`currencylayer error: ${info}`);
  }

  // Quotes look like { USDEUR: 0.92, USDGBP: 0.79, ... }.
  const quotes: Record<string, number> = data.quotes ?? {};
  const rates: RateInput[] = [{ fromCurrency: 'USD', toCurrency: 'USD', rate: 1 }];
  for (const [pair, rate] of Object.entries(quotes)) {
    const to = pair.slice(3); // strip "USD"
    if (typeof rate === 'number' && rate > 0) rates.push({ fromCurrency: 'USD', toCurrency: to, rate });
  }
  return rates;
}

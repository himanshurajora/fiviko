import { useQuery } from '@tanstack/react-query';
import type { FinancialSummary } from '@fiviko/shared';
import { api } from './api';

/** Fetches the derived financial summary for the dashboard. */
export function useFinancialSummary() {
  return useQuery({
    queryKey: ['profile', 'summary'],
    queryFn: async (): Promise<FinancialSummary> => {
      const { data } = await api.get<FinancialSummary>('/profile/summary');
      return data;
    },
  });
}

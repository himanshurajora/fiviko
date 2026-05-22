import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BadgeDTO, OnboardingPayload, OnboardingResult } from '@fiviko/shared';
import { api } from './api';

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: async (): Promise<BadgeDTO[]> => (await api.get('/badges')).data,
  });
}

/** Submits the whole onboarding payload and returns the first health score + badges. */
export function useSubmitOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OnboardingPayload): Promise<OnboardingResult> =>
      (await api.post('/onboarding', payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profile', 'summary'] });
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['badges'] });
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { StreakType, type ChallengeDTO, type StreakDTO } from '@fiviko/shared';
import { api } from './api';

export function useStreaks() {
  return useQuery({
    queryKey: ['streaks'],
    queryFn: async (): Promise<StreakDTO[]> => (await api.get('/streaks')).data,
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async (): Promise<ChallengeDTO[]> => (await api.get('/challenges')).data,
  });
}

/** Display metadata per streak type. */
export const STREAK_META: Record<StreakType, { label: string; emoji: string }> = {
  [StreakType.ExpenseLogging]: { label: 'Logging streak', emoji: '🔥' },
  [StreakType.Saving]: { label: 'Saving streak', emoji: '💎' },
  [StreakType.UnderBudget]: { label: 'Under-budget streak', emoji: '🛡️' },
  [StreakType.NoImpulse]: { label: 'No-impulse streak', emoji: '🧘' },
};

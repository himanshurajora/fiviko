import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface AiResult {
  text: string;
  cached: boolean;
}

/** Whether the server has AI configured (hides AI surfaces otherwise). */
export function useAiStatus() {
  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: async (): Promise<{ enabled: boolean }> => (await api.get('/ai/status')).data,
    staleTime: 1000 * 60 * 10,
  });
}

export function useMonthlyReport(enabled: boolean) {
  return useQuery({
    queryKey: ['ai', 'monthly-report'],
    enabled,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<AiResult> => (await api.get('/ai/monthly-report')).data,
  });
}

export function useSavingsTips(enabled: boolean) {
  return useQuery({
    queryKey: ['ai', 'tips'],
    enabled,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<AiResult> => (await api.get('/ai/tips')).data,
  });
}

export function useExplainDecision() {
  return useMutation({
    mutationFn: async (goalId: string): Promise<AiResult> => (await api.get(`/ai/explain/${goalId}`)).data,
  });
}

export function useCoachAsk() {
  return useMutation({
    mutationFn: async (question: string): Promise<AiResult> => (await api.post('/ai/coach', { question })).data,
  });
}

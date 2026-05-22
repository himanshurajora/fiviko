import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GoalCategory,
  GoalDTO,
  GoalPriority,
  GoalScoreInputValues,
  GoalType,
  RecommendationResult,
} from '@fiviko/shared';
import { api } from './api';

export interface CreateGoalPayload {
  name: string;
  type: GoalType;
  category: GoalCategory;
  targetAmount: number;
  currency: string;
  currentSavedAmount: number;
  targetDate?: string | null;
  priority: GoalPriority;
  expectedMaintenanceCost?: number | null;
  notes?: string | null;
}

export interface GoalDetailResponse {
  goal: GoalDTO;
  scoreInput: (GoalScoreInputValues & { id: string }) | null;
  recommendation: RecommendationResult | null;
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async (): Promise<GoalDTO[]> => (await api.get('/goals')).data,
  });
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: ['goals', id],
    enabled: !!id,
    queryFn: async (): Promise<GoalDetailResponse> => (await api.get(`/goals/${id}`)).data,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGoalPayload): Promise<GoalDTO> =>
      (await api.post('/goals', payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['badges'] });
      void qc.invalidateQueries({ queryKey: ['level'] });
    },
  });
}

export interface UpdateGoalPayload {
  name?: string;
  targetAmount?: number;
  currentSavedAmount?: number;
  priority?: GoalPriority;
  /** Ongoing monthly running cost the goal would add. */
  expectedMaintenanceCost?: number | null;
}

export function useUpdateGoal(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateGoalPayload): Promise<GoalDTO> =>
      (await api.put(`/goals/${goalId}`, payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['goals', goalId] });
      void qc.invalidateQueries({ queryKey: ['level'] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/goals/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['badges'] });
      void qc.invalidateQueries({ queryKey: ['level'] });
    },
  });
}

/** Saves the 1–100 answers and returns the freshly computed recommendation. */
export function useSaveScoreInput(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scores: GoalScoreInputValues): Promise<RecommendationResult> =>
      (await api.post(`/goals/${goalId}/score-inputs`, scores)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['goals', goalId] });
    },
  });
}

/** Re-runs the decision engine for a goal (after editing its fields/finances). */
export function useRecalculate(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<RecommendationResult> =>
      (await api.post(`/goals/${goalId}/recalculate`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['goals', goalId] });
    },
  });
}

/** Records actual savings put toward a goal (in the goal's currency). */
export function useContribute(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number): Promise<GoalDTO> =>
      (await api.post(`/goals/${goalId}/contribute`, { amount })).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      void qc.invalidateQueries({ queryKey: ['goals', goalId] });
      void qc.invalidateQueries({ queryKey: ['badges'] });
      void qc.invalidateQueries({ queryKey: ['level'] });
    },
  });
}

export function useWhatIf(goalId: string) {
  return useMutation({
    mutationFn: async (overrideTargetAmount?: number): Promise<RecommendationResult> =>
      (await api.post(`/goals/${goalId}/what-if`, overrideTargetAmount != null ? { overrideTargetAmount } : {})).data,
  });
}

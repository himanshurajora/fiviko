import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  AssetDTO,
  AssetType,
  ExpenseTrendPoint,
  IncomeDTO,
  IncomeType,
  LiabilityDTO,
  LiabilityType,
  MandatoryExpenseCategory,
  MandatoryExpenseDTO,
} from '@fiviko/shared';
import { api } from './api';

/** Anything that changes the financial profile invalidates derived views. */
function invalidateProfile(qc: QueryClient): void {
  for (const key of ['assets', 'liabilities', 'incomes', 'mandatory-expenses']) {
    void qc.invalidateQueries({ queryKey: [key] });
  }
  void qc.invalidateQueries({ queryKey: ['profile', 'summary'] });
  void qc.invalidateQueries({ queryKey: ['goals'] });
  void qc.invalidateQueries({ queryKey: ['level'] });
}

export function useAssets() {
  return useQuery({ queryKey: ['assets'], queryFn: async (): Promise<AssetDTO[]> => (await api.get('/assets')).data });
}
export function useLiabilities() {
  return useQuery({ queryKey: ['liabilities'], queryFn: async (): Promise<LiabilityDTO[]> => (await api.get('/liabilities')).data });
}
export function useIncomes() {
  return useQuery({ queryKey: ['incomes'], queryFn: async (): Promise<IncomeDTO[]> => (await api.get('/incomes')).data });
}
export function useMandatoryExpenses() {
  return useQuery({ queryKey: ['mandatory-expenses'], queryFn: async (): Promise<MandatoryExpenseDTO[]> => (await api.get('/mandatory-expenses')).data });
}

export function useExpenseTrend(months = 6) {
  return useQuery({
    queryKey: ['expense-trend', months],
    queryFn: async (): Promise<ExpenseTrendPoint[]> => (await api.get('/expenses/trend', { params: { months } })).data,
  });
}

export interface AssetPayload { type: AssetType; name: string; amount: number; currency: string; liquidityType: string }
export interface LiabilityPayload { type: LiabilityType; name: string; outstandingAmount: number; monthlyPayment: number; currency: string }
export interface IncomePayload { type: IncomeType; amount: number; currency: string; frequency: string }
export interface MandatoryPayload { category: MandatoryExpenseCategory; amount: number; currency: string; frequency: string }

/** Generic create+delete mutations for one finance resource path. */
function useResourceMutations<P>(path: string) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (payload: P) => (await api.post(`/${path}`, payload)).data,
    onSuccess: () => invalidateProfile(qc),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/${path}/${id}`)).data,
    onSuccess: () => invalidateProfile(qc),
  });
  return { create, remove };
}

export const useAssetMutations = () => useResourceMutations<AssetPayload>('assets');
export const useLiabilityMutations = () => useResourceMutations<LiabilityPayload>('liabilities');
export const useIncomeMutations = () => useResourceMutations<IncomePayload>('incomes');
export const useMandatoryMutations = () => useResourceMutations<MandatoryPayload>('mandatory-expenses');

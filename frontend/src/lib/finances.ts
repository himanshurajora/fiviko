import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  AssetDTO,
  AssetType,
  ExpenseTrendPoint,
  IncomeDTO,
  IncomeHistoryEntry,
  IncomeType,
  LiabilityDTO,
  LiabilityType,
  MandatoryExpenseCategory,
  MandatoryExpenseDTO,
  NetWorthHistoryEntry,
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

export function useIncomeHistory(months = 6) {
  return useQuery({
    queryKey: ['income-history', months],
    queryFn: async (): Promise<IncomeHistoryEntry[]> => (await api.get('/income-history', { params: { months } })).data,
  });
}

export type NetWorthGranularity = 'D' | 'W' | 'M' | 'Y' | 'ALL';

export function useNetWorthHistory(granularity: NetWorthGranularity = 'M') {
  return useQuery({
    queryKey: ['networth-history', granularity],
    queryFn: async (): Promise<NetWorthHistoryEntry[]> =>
      (await api.get('/networth-history', { params: { granularity } })).data,
  });
}

/** Per-asset balance history in the asset's native currency (for mini charts). */
export function useAssetHistory(assetId: string, days = 180) {
  return useQuery({
    queryKey: ['asset-history', assetId, days],
    queryFn: async (): Promise<{ date: string; amount: number }[]> =>
      (await api.get(`/networth-history/assets/${assetId}`, { params: { days } })).data,
  });
}

/** Update one asset's native balance — the tracker's primary mutation. */
export function useSetAssetBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }): Promise<AssetDTO> =>
      (await api.put(`/assets/${id}/balance`, { amount })).data,
    onSuccess: () => {
      invalidateProfile(qc);
      void qc.invalidateQueries({ queryKey: ['networth-history'] });
      void qc.invalidateQueries({ queryKey: ['asset-history'] });
    },
  });
}

/** Manually snapshot today's net worth (used by the tracker's "Save" button). */
export function useSnapshotNetWorth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post('/networth-history/snapshot')).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['networth-history'] }),
  });
}

/** Manually set a month's income (overrides the auto snapshot). */
export function useSetMonthlyIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, amount }: { month: string; amount: number }): Promise<IncomeHistoryEntry> =>
      (await api.put(`/income-history/${month}`, { amount })).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['income-history'] });
      void qc.invalidateQueries({ queryKey: ['expense-trend'] });
    },
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

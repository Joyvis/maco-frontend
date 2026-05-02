'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Combo,
  ComboSummary,
  ComboFilters,
  CreateComboInput,
  UpdateComboInput,
} from '@/types/combo';

// ─── Query key factories ───────────────────────────────────────────────────────
export const comboKeys = {
  all: ['combos'] as const,
  lists: () => [...comboKeys.all, 'list'] as const,
  list: (filters: ComboFilters) => [...comboKeys.lists(), filters] as const,
  details: () => [...comboKeys.all, 'detail'] as const,
  detail: (id: string) => [...comboKeys.details(), id] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useCombos(
  filters: Omit<ComboFilters, 'page' | 'page_size'> = {},
  options?: { pageSize?: number; initialPage?: number },
) {
  return usePaginatedQuery<ComboSummary>(
    (params) => comboKeys.list({ ...filters, ...params }),
    (params) =>
      apiClient.get<PaginatedResponse<ComboSummary>>('/combos', {
        ...filters,
        ...params,
      }),
    options,
  );
}

export function useCombo(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: comboKeys.detail(id),
    queryFn: () => apiClient.get<ApiResponse<Combo>>(`/combos/${id}`),
    enabled: Boolean(id),
  });
  return { data: data?.data, ...rest };
}

export function useCreateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateComboInput) =>
      apiClient.post<ApiResponse<Combo>>('/combos', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comboKeys.lists() });
    },
  });
}

export function useUpdateCombo(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateComboInput) =>
      apiClient.patch<ApiResponse<Combo>>(`/combos/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: comboKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: comboKeys.detail(id) });
    },
  });
}

export function useArchiveCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<Combo>>(`/combos/${id}/archive`),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: comboKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: comboKeys.detail(id) });
    },
  });
}

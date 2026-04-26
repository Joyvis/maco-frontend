'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ─── Service type (stub — replace with generated schema type when available) ───
export interface Service {
  id: string;
  name: string;
  status?: 'active' | 'inactive';
}

export interface ServiceFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  status?: 'active' | 'inactive';
  page?: number;
  page_size?: number;
}

// ─── Query key factory ─────────────────────────────────────────────────────────
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: ServiceFilters) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useServices(
  filters: Omit<ServiceFilters, 'page' | 'page_size'> = {},
  options?: { pageSize?: number; initialPage?: number },
) {
  return usePaginatedQuery<Service>(
    (params) => serviceKeys.list({ ...filters, ...params }),
    (params) =>
      apiClient.get<PaginatedResponse<Service>>('/services', {
        ...filters,
        ...params,
      }),
    options,
  );
}

export function useService(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => apiClient.get<ApiResponse<Service>>(`/services/${id}`),
    enabled: Boolean(id),
  });

  return {
    data: data?.data,
    ...rest,
  };
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Service>) =>
      apiClient.post<ApiResponse<Service>>('/services', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

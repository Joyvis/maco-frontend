import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ─── Service type (stub — replace with generated schema type when available) ───
export interface Service {
  id: string;
  name: string;
  status?: 'active' | 'inactive';
}

export interface ServiceFilters {
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
export function useServices(filters: ServiceFilters) {
  const { data, ...rest } = useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: () => apiClient.get<PaginatedResponse<Service>>('/services', filters as Record<string, unknown>),
  });

  return {
    data: data?.data,
    meta: data?.meta,
    ...rest,
  };
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => apiClient.get<ApiResponse<Service>>(`/services/${id}`),
    enabled: Boolean(id),
  });
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

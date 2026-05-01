'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Service,
  ServiceConsumption,
  ServiceDependency,
  ServiceFilters,
  CreateServiceInput,
  UpdateServiceInput,
  AddConsumptionInput,
  AddDependencyInput,
} from '@/types/service';

// ─── Query key factories ───────────────────────────────────────────────────────
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: ServiceFilters) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

export const consumptionKeys = {
  all: (serviceId: string) => ['services', serviceId, 'consumptions'] as const,
};

export const dependencyKeys = {
  all: (serviceId: string) => ['services', serviceId, 'dependencies'] as const,
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
  return { data: data?.data, ...rest };
}

export function useAllServices() {
  const { data, ...rest } = useQuery({
    queryKey: [...serviceKeys.lists(), { page_size: 100 }],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Service>>('/services', {
        page_size: 100,
      }),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) =>
      apiClient.post<ApiResponse<Service>>('/services', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

export function useUpdateService(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateServiceInput) =>
      apiClient.patch<ApiResponse<Service>>(`/services/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
    },
  });
}

export function useActivateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<Service>>(`/services/${id}/activate`),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
    },
  });
}

export function useArchiveService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<Service>>(`/services/${id}/archive`),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
    },
  });
}

export function useConsumptions(serviceId: string) {
  const { data, ...rest } = useQuery({
    queryKey: consumptionKeys.all(serviceId),
    queryFn: () =>
      apiClient.get<ApiResponse<ServiceConsumption[]>>(
        `/services/${serviceId}/consumptions`,
      ),
    enabled: Boolean(serviceId),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useAddConsumption(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddConsumptionInput) =>
      apiClient.post<ApiResponse<ServiceConsumption>>(
        `/services/${serviceId}/consumptions`,
        input,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: consumptionKeys.all(serviceId),
      });
    },
  });
}

export function useRemoveConsumption(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      apiClient.delete<ApiResponse<null>>(
        `/services/${serviceId}/consumptions/${productId}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: consumptionKeys.all(serviceId),
      });
    },
  });
}

export function useDependencies(serviceId: string) {
  const { data, ...rest } = useQuery({
    queryKey: dependencyKeys.all(serviceId),
    queryFn: () =>
      apiClient.get<ApiResponse<ServiceDependency[]>>(
        `/services/${serviceId}/dependencies`,
      ),
    enabled: Boolean(serviceId),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useAddDependency(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddDependencyInput) =>
      apiClient.post<ApiResponse<ServiceDependency>>(
        `/services/${serviceId}/dependencies`,
        input,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dependencyKeys.all(serviceId),
      });
    },
  });
}

export function useRemoveDependency(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dependencyId: string) =>
      apiClient.delete<ApiResponse<null>>(
        `/services/${serviceId}/dependencies/${dependencyId}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dependencyKeys.all(serviceId),
      });
    },
  });
}

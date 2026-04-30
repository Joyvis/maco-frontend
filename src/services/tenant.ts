'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  Tenant,
  TenantConfig,
  UpdateTenantPayload,
  UpdateTenantConfigsPayload,
} from '@/types/tenant';

// ─── Query key factory ─────────────────────────────────────────────────────────
export const tenantKeys = {
  all: ['tenants'] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  configs: (id: string) => [...tenantKeys.detail(id), 'configs'] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useTenant(tenantId: string) {
  const { data, ...rest } = useQuery({
    queryKey: tenantKeys.detail(tenantId),
    queryFn: () => apiClient.get<ApiResponse<Tenant>>(`/tenants/${tenantId}`),
    enabled: Boolean(tenantId),
  });

  return { data: data?.data, ...rest };
}

export function useUpdateTenant(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) =>
      apiClient.patch<ApiResponse<Tenant>>(`/tenants/${tenantId}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantKeys.detail(tenantId),
      });
    },
  });
}

export function useTenantConfigs(tenantId: string) {
  const { data, ...rest } = useQuery({
    queryKey: tenantKeys.configs(tenantId),
    queryFn: () =>
      apiClient.get<ApiResponse<TenantConfig[]>>(
        `/tenants/${tenantId}/configs`,
      ),
    enabled: Boolean(tenantId),
  });

  return { data: data?.data ?? [], ...rest };
}

export function useUpdateTenantConfigs(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTenantConfigsPayload) =>
      apiClient.put<ApiResponse<TenantConfig[]>>(
        `/tenants/${tenantId}/configs`,
        payload,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantKeys.configs(tenantId),
      });
    },
  });
}

export function useSuspendTenant(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<Tenant>>(`/tenants/${tenantId}/suspend`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantKeys.detail(tenantId),
      });
    },
  });
}

export function useReactivateTenant(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<Tenant>>(`/tenants/${tenantId}/reactivate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantKeys.detail(tenantId),
      });
    },
  });
}

export function useCancelTenant(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<ApiResponse<Tenant>>(`/tenants/${tenantId}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tenantKeys.detail(tenantId),
      });
    },
  });
}

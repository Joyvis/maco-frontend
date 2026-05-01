'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Role,
  RoleUser,
  RoleFilters,
  CreateRoleInput,
  UpdateRoleInput,
} from '@/types/role';

// ─── Query key factory ─────────────────────────────────────────────────────────
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: RoleFilters) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  users: (id: string) => [...roleKeys.detail(id), 'users'] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useRoles(
  filters: Omit<RoleFilters, 'page' | 'page_size'> = {},
  options?: { pageSize?: number; initialPage?: number },
) {
  return usePaginatedQuery<Role>(
    (params) => roleKeys.list({ ...filters, ...params }),
    (params) =>
      apiClient.get<PaginatedResponse<Role>>('/roles', {
        ...filters,
        ...params,
      }),
    options,
  );
}

export function useRole(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => apiClient.get<ApiResponse<Role>>(`/roles/${id}`),
    enabled: Boolean(id),
  });
  return { data: data?.data, ...rest };
}

export function useRoleUsers(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: roleKeys.users(id),
    queryFn: () => apiClient.get<ApiResponse<RoleUser[]>>(`/roles/${id}/users`),
    enabled: Boolean(id),
  });
  return { data: data?.data, ...rest };
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) =>
      apiClient.post<ApiResponse<Role>>('/roles', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoleInput) =>
      apiClient.patch<ApiResponse<Role>>(`/roles/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/roles/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

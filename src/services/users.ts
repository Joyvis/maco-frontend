'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { ManagedUser, UserFilters } from '@/types/user-management';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(filters: UserFilters = {}) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ManagedUser>>('/users', {
        ...filters,
        page: 1,
        page_size: 100,
      }),
  });
  return { data: data?.data ?? [], meta: data?.meta, isLoading, isFetching };
}

export function useUser(id: string) {
  const { data, ...rest } = useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => apiClient.get<ApiResponse<ManagedUser>>(`/users/${id}`),
    enabled: Boolean(id),
  });
  return { data: data?.data, ...rest };
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role_ids: string[];
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserData) =>
      apiClient.post<ApiResponse<ManagedUser>>('/users', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export interface UpdateUserData {
  name: string;
  role_ids: string[];
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserData) =>
      apiClient.patch<ApiResponse<ManagedUser>>(`/users/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<ManagedUser>>(`/users/${id}/deactivate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ApiResponse<ManagedUser>>(`/users/${id}/reactivate`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export interface InviteUserData {
  email: string;
  role_ids: string[];
  message?: string;
}

export function useInviteUser() {
  return useMutation({
    mutationFn: (data: InviteUserData) =>
      apiClient.post<ApiResponse<{ id: string }>>('/users/invite', data),
  });
}

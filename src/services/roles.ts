'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type { Role } from '@/types/user-management';

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
};

export function useRoles() {
  const { data, ...rest } = useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => apiClient.get<ApiResponse<Role[]>>('/roles'),
  });
  return { data: data?.data, ...rest };
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  StaffSchedule,
  ScheduleBlock,
  BulkScheduleInput,
  CreateBlockInput,
} from '@/types/schedule';
import type { ManagedUser } from '@/types/user-management';

export const scheduleKeys = {
  all: ['schedules'] as const,
  staffSchedule: (staffId: string) =>
    [...scheduleKeys.all, 'schedule', staffId] as const,
  staffBlocks: (staffId: string) =>
    [...scheduleKeys.all, 'blocks', staffId] as const,
};

export const staffListKeys = {
  all: ['staffList'] as const,
  lists: () => [...staffListKeys.all, 'list'] as const,
};

export function useStaffList() {
  const { data, isLoading } = useQuery({
    queryKey: staffListKeys.lists(),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ManagedUser>>('/users', {
        'q[roles_slug_eq]': 'staff',
        page: 1,
        page_size: 100,
      }),
  });
  return { data: data?.data ?? [], isLoading };
}

export function useStaffSchedule(staffId: string) {
  const { data, isLoading, ...rest } = useQuery({
    queryKey: scheduleKeys.staffSchedule(staffId),
    queryFn: () =>
      apiClient.get<ApiResponse<StaffSchedule | null>>(
        `/staff/${staffId}/schedules`,
      ),
    enabled: Boolean(staffId),
  });
  return { data: data?.data ?? null, isLoading, ...rest };
}

export function useSetBulkSchedule(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkScheduleInput) =>
      apiClient.put<ApiResponse<StaffSchedule>>(
        `/staff/${staffId}/schedules/bulk`,
        input,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleKeys.staffSchedule(staffId),
      });
    },
  });
}

export function useStaffBlocks(staffId: string) {
  const { data, isLoading, ...rest } = useQuery({
    queryKey: scheduleKeys.staffBlocks(staffId),
    queryFn: () =>
      apiClient.get<ApiResponse<ScheduleBlock[]>>(`/staff/${staffId}/blocks`),
    enabled: Boolean(staffId),
  });
  return { data: data?.data ?? [], isLoading, ...rest };
}

export function useCreateBlock(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockInput) =>
      apiClient.post<ApiResponse<ScheduleBlock>>(
        `/staff/${staffId}/blocks`,
        input,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleKeys.staffBlocks(staffId),
      });
    },
  });
}

export function useDeleteBlock(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) =>
      apiClient.delete<void>(`/staff/${staffId}/blocks/${blockId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleKeys.staffBlocks(staffId),
      });
    },
  });
}

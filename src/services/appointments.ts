'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  SaleOrder,
  RefundPolicy,
  AvailabilitySlot,
  CancelOrderInput,
  RescheduleOrderInput,
} from '@/types/appointment';

// ─── Query key factory ─────────────────────────────────────────────────────────
export const appointmentKeys = {
  all: ['appointments'] as const,
  upcoming: () => [...appointmentKeys.all, 'upcoming'] as const,
  history: () => [...appointmentKeys.all, 'history'] as const,
  refundPolicies: () => [...appointmentKeys.all, 'refund-policies'] as const,
  availability: (date: string) =>
    [...appointmentKeys.all, 'availability', date] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useUpcomingAppointments() {
  const { data, ...rest } = useQuery({
    queryKey: appointmentKeys.upcoming(),
    queryFn: () =>
      apiClient.get<PaginatedResponse<SaleOrder>>('/sale-orders', {
        customer_id: 'me',
        state: 'confirmed,checked_in,in_progress',
      }),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useAppointmentHistory() {
  const { data, ...rest } = useQuery({
    queryKey: appointmentKeys.history(),
    queryFn: () =>
      apiClient.get<PaginatedResponse<SaleOrder>>('/sale-orders', {
        customer_id: 'me',
        state: 'completed,cancelled,no_show',
      }),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useRefundPolicies() {
  const { data, ...rest } = useQuery({
    queryKey: appointmentKeys.refundPolicies(),
    queryFn: () =>
      apiClient.get<ApiResponse<RefundPolicy[]>>('/refund-policies'),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useAvailability(date: string) {
  const { data, ...rest } = useQuery({
    queryKey: appointmentKeys.availability(date),
    queryFn: () =>
      apiClient.get<ApiResponse<AvailabilitySlot[]>>('/availability', { date }),
    enabled: Boolean(date),
  });
  return { data: data?.data ?? [], ...rest };
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & CancelOrderInput) =>
      apiClient.post<ApiResponse<SaleOrder>>(`/sale-orders/${id}/cancel`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: appointmentKeys.upcoming(),
      });
      void queryClient.invalidateQueries({
        queryKey: appointmentKeys.history(),
      });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & RescheduleOrderInput) =>
      apiClient.post<ApiResponse<SaleOrder>>(
        `/sale-orders/${id}/reschedule`,
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: appointmentKeys.upcoming(),
      });
    },
  });
}

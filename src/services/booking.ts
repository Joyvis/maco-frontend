'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  TimeSlot,
  CreateBookingInput,
  BookingResult,
} from '@/types/booking';

// ─── Query key factory ─────────────────────────────────────────────────────────
export const availabilityKeys = {
  all: ['availability'] as const,
  slots: (serviceId: string, date: string, staffId?: string) =>
    [
      ...availabilityKeys.all,
      'slots',
      serviceId,
      date,
      staffId ?? 'any',
    ] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────
export function useAvailability(
  serviceId: string,
  date: string,
  shopSlug: string,
  staffId?: string,
) {
  const { data, ...rest } = useQuery({
    queryKey: availabilityKeys.slots(serviceId, date, staffId),
    queryFn: () =>
      apiClient.get<ApiResponse<TimeSlot[]>>('/availability', {
        service_id: serviceId,
        date,
        end_date: date,
        shop_slug: shopSlug,
        ...(staffId ? { staff_id: staffId } : {}),
      }),
    enabled: Boolean(serviceId) && Boolean(date),
  });
  return { data: data?.data, ...rest };
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      apiClient.post<ApiResponse<BookingResult>>('/sale-orders', input),
  });
}

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  appointmentKeys,
  useUpcomingAppointments,
  useAppointmentHistory,
  useRefundPolicies,
  useAvailability,
  useCancelAppointment,
  useRescheduleAppointment,
} from '@/services/appointments';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type {
  SaleOrder,
  RefundPolicy,
  AvailabilitySlot,
} from '@/types/appointment';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  configureAuth: vi.fn(),
  resetAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockOrder: SaleOrder = {
  id: 'ord-1',
  state: 'confirmed',
  scheduled_at: '2026-05-10T10:00:00Z',
  service_name: 'Corte de Cabelo',
  professional_name: 'João',
  total_amount: 50,
  created_at: '2026-05-01T00:00:00Z',
};

// ─── appointmentKeys factory ───────────────────────────────────────────────────
describe('appointmentKeys factory', () => {
  it('all returns base key', () => {
    expect(appointmentKeys.all).toEqual(['appointments']);
  });

  it('upcoming returns scoped key', () => {
    expect(appointmentKeys.upcoming()).toEqual(['appointments', 'upcoming']);
  });

  it('history returns scoped key', () => {
    expect(appointmentKeys.history()).toEqual(['appointments', 'history']);
  });

  it('refundPolicies returns scoped key', () => {
    expect(appointmentKeys.refundPolicies()).toEqual([
      'appointments',
      'refund-policies',
    ]);
  });

  it('availability returns scoped key with date', () => {
    expect(appointmentKeys.availability('2026-05-10')).toEqual([
      'appointments',
      'availability',
      '2026-05-10',
    ]);
  });
});

// ─── useUpcomingAppointments ───────────────────────────────────────────────────
describe('useUpcomingAppointments', () => {
  it('fetches upcoming orders and returns data array', async () => {
    const mockResponse: PaginatedResponse<SaleOrder> = {
      data: [mockOrder],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpcomingAppointments(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockOrder]);
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders', {
      customer_id: 'me',
      state: 'confirmed,checked_in,in_progress',
    });
  });

  it('returns empty array when response has no data', async () => {
    (apiClient.get as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpcomingAppointments(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});

// ─── useAppointmentHistory ─────────────────────────────────────────────────────
describe('useAppointmentHistory', () => {
  it('fetches history orders and returns data array', async () => {
    const mockResponse: PaginatedResponse<SaleOrder> = {
      data: [{ ...mockOrder, state: 'completed' }],
      meta: { total: 1, page: 1, page_size: 10 },
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAppointmentHistory(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockResponse.data);
    expect(apiClient.get).toHaveBeenCalledWith('/sale-orders', {
      customer_id: 'me',
      state: 'completed,cancelled,no_show',
    });
  });
});

// ─── useRefundPolicies ─────────────────────────────────────────────────────────
describe('useRefundPolicies', () => {
  it('fetches refund policies and returns data array', async () => {
    const mockPolicy: RefundPolicy = {
      id: 'pol-1',
      description: 'Cancelamento com 24h de antecedência',
      refund_percentage: 100,
    };
    const mockResponse: ApiResponse<RefundPolicy[]> = { data: [mockPolicy] };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRefundPolicies(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([mockPolicy]);
    expect(apiClient.get).toHaveBeenCalledWith('/refund-policies');
  });
});

// ─── useAvailability ───────────────────────────────────────────────────────────
describe('useAvailability', () => {
  it('fetches availability slots for given date', async () => {
    const slot: AvailabilitySlot = {
      datetime: '2026-05-10T10:00:00Z',
      available: true,
    };
    const mockResponse: ApiResponse<AvailabilitySlot[]> = { data: [slot] };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAvailability('2026-05-10'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([slot]);
    expect(apiClient.get).toHaveBeenCalledWith('/availability', {
      date: '2026-05-10',
    });
  });

  it('does not fetch when date is empty', () => {
    const { result } = renderHook(() => useAvailability(''), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('returns empty array when response has no data', async () => {
    (apiClient.get as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAvailability(''), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});

// ─── useCancelAppointment ─────────────────────────────────────────────────────
describe('useCancelAppointment', () => {
  it('calls POST to cancel endpoint and invalidates upcoming and history', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mockResponse: ApiResponse<SaleOrder> = {
      data: { ...mockOrder, state: 'cancelled' },
    };
    (apiClient.post as Mock).mockResolvedValue(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });
    result.current.mutate({ id: 'ord-1', reason: 'Motivo pessoal' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith('/sale-orders/ord-1/cancel', {
      reason: 'Motivo pessoal',
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: appointmentKeys.upcoming() }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: appointmentKeys.history() }),
    );
  });
});

// ─── useRescheduleAppointment ─────────────────────────────────────────────────
describe('useRescheduleAppointment', () => {
  it('calls POST to reschedule endpoint and invalidates upcoming', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mockResponse: ApiResponse<SaleOrder> = { data: mockOrder };
    (apiClient.post as Mock).mockResolvedValue(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRescheduleAppointment(), {
      wrapper,
    });
    result.current.mutate({
      id: 'ord-1',
      new_datetime: '2026-05-15T09:00:00Z',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith(
      '/sale-orders/ord-1/reschedule',
      { new_datetime: '2026-05-15T09:00:00Z' },
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: appointmentKeys.upcoming() }),
    );
  });
});

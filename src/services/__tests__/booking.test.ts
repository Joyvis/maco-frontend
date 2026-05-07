import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { TimeSlot } from '@/types/booking';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const MOCK_SLOTS: TimeSlot[] = [
  {
    date: '2025-05-07',
    start_time: '09:00',
    end_time: '10:00',
    available: true,
  },
];

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

beforeEach(() => vi.clearAllMocks());

describe('useAvailability', () => {
  it('fetches slots when serviceId and date are provided', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_SLOTS });
    const { useAvailability } = await import('@/services/booking');
    const { result } = renderHook(
      () => useAvailability('svc-1', '2025-05-07', 'my-shop'),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(MOCK_SLOTS);
    expect(apiClient.get).toHaveBeenCalledWith(
      '/availability',
      expect.objectContaining({ service_id: 'svc-1', date: '2025-05-07' }),
    );
  });

  it('does not fetch when date is empty', async () => {
    const { useAvailability } = await import('@/services/booking');
    const { result } = renderHook(
      () => useAvailability('svc-1', '', 'my-shop'),
      { wrapper: makeWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('does not fetch when serviceId is empty', async () => {
    const { useAvailability } = await import('@/services/booking');
    const { result } = renderHook(
      () => useAvailability('', '2025-05-07', 'my-shop'),
      { wrapper: makeWrapper() },
    );

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('includes staff_id in query params when provided', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_SLOTS });
    const { useAvailability } = await import('@/services/booking');
    renderHook(
      () => useAvailability('svc-1', '2025-05-07', 'my-shop', 'staff-1'),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    expect(apiClient.get).toHaveBeenCalledWith(
      '/availability',
      expect.objectContaining({ staff_id: 'staff-1' }),
    );
  });
});

describe('useCreateBooking', () => {
  it('posts to /sale-orders with booking input', async () => {
    (apiClient.post as Mock).mockResolvedValue({
      data: { id: 'order-1', requires_payment: false },
    });
    const { useCreateBooking } = await import('@/services/booking');
    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: makeWrapper(),
    });

    await result.current.mutateAsync({
      service_id: 'svc-1',
      shop_slug: 'my-shop',
      date: '2025-05-07',
      start_time: '09:00',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/sale-orders',
      expect.objectContaining({
        service_id: 'svc-1',
        shop_slug: 'my-shop',
        date: '2025-05-07',
        start_time: '09:00',
      }),
    );
  });
});

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import type { PaginatedResponse } from '@/types/api';

jest.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

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

// ─── AC-20: usePaginatedQuery ─────────────────────────────────────────────────
describe('AC-20: usePaginatedQuery returns data, meta, isLoading, page, setPage', () => {
  it('returns correct values on page 1 load', async () => {
    const mockData: PaginatedResponse<{ id: string }> = {
      data: [{ id: '1' }],
      meta: { total: 5, page: 1, page_size: 2 },
    };
    const fetcher = jest.fn().mockResolvedValue(mockData);
    const keyFactory = (params: { page: number; page_size: number }) =>
      ['items', params] as const;

    const { result } = renderHook(
      () => usePaginatedQuery(keyFactory, fetcher, { pageSize: 2 }),
      {
        wrapper: makeWrapper(),
      },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.page).toBe(1);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData.data);
    expect(result.current.meta).toEqual(mockData.meta);
    expect(result.current.page).toBe(1);
    expect(typeof result.current.setPage).toBe('function');
    expect(typeof result.current.isFetching).toBe('boolean');
  });

  it('fetches new page when setPage is called', async () => {
    const page1: PaginatedResponse<{ id: string }> = {
      data: [{ id: '1' }],
      meta: { total: 4, page: 1, page_size: 2 },
    };
    const page2: PaginatedResponse<{ id: string }> = {
      data: [{ id: '3' }],
      meta: { total: 4, page: 2, page_size: 2 },
    };
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);
    const keyFactory = (params: { page: number; page_size: number }) =>
      ['items', params] as const;

    const { result } = renderHook(
      () => usePaginatedQuery(keyFactory, fetcher, { pageSize: 2 }),
      {
        wrapper: makeWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page).toBe(1);

    act(() => result.current.setPage(2));

    await waitFor(() => expect(result.current.page).toBe(2));
    await waitFor(() => expect(result.current.data).toEqual(page2.data));
    expect(result.current.meta?.page).toBe(2);
  });
});

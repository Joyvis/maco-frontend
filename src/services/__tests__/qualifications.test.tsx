import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import {
  qualificationKeys,
  useStaffQualifications,
  useQualifiedStaff,
  useGrantQualification,
  useRevokeQualification,
} from '@/services/qualifications';
import type { ApiResponse } from '@/types/api';
import type { StaffQualification, QualifiedStaff } from '@/types/qualification';

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

// ─── qualificationKeys factory ────────────────────────────────────────────────
describe('qualificationKeys factory', () => {
  it('all returns base key', () => {
    expect(qualificationKeys.all).toEqual(['qualifications']);
  });

  it('staffQualifications returns scoped key', () => {
    expect(qualificationKeys.staffQualifications('u1')).toEqual([
      'qualifications',
      'staff',
      'u1',
    ]);
  });

  it('serviceQualifiedStaff returns scoped key', () => {
    expect(qualificationKeys.serviceQualifiedStaff('s1')).toEqual([
      'qualifications',
      'service',
      's1',
    ]);
  });
});

// ─── useStaffQualifications ───────────────────────────────────────────────────
describe('useStaffQualifications', () => {
  it('fetches and returns qualifications for staff', async () => {
    const mockResponse: ApiResponse<StaffQualification[]> = {
      data: [{ service_id: 's1', service_name: 'Corte' }],
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useStaffQualifications('u1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockResponse.data);
  });

  it('does not fetch when staffId is empty', () => {
    const { result } = renderHook(() => useStaffQualifications(''), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});

// ─── useQualifiedStaff ────────────────────────────────────────────────────────
describe('useQualifiedStaff', () => {
  it('fetches and returns qualified staff for service', async () => {
    const mockResponse: ApiResponse<QualifiedStaff[]> = {
      data: [{ user_id: 'u1', name: 'João', email: 'joao@example.com' }],
    };
    (apiClient.get as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQualifiedStaff('s1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockResponse.data);
  });
});

// ─── useGrantQualification ────────────────────────────────────────────────────
describe('useGrantQualification', () => {
  it('calls POST to correct endpoint and invalidates both query keys', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mockResponse: ApiResponse<StaffQualification> = {
      data: { service_id: 's1', service_name: 'Corte' },
    };
    (apiClient.post as Mock).mockResolvedValue(mockResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useGrantQualification(), { wrapper });
    result.current.mutate({ staffId: 'u1', serviceId: 's1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith('/staff/u1/qualifications', {
      service_id: 's1',
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: qualificationKeys.staffQualifications('u1'),
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: qualificationKeys.serviceQualifiedStaff('s1'),
      }),
    );
  });
});

// ─── useRevokeQualification ───────────────────────────────────────────────────
describe('useRevokeQualification', () => {
  it('calls DELETE to correct endpoint and invalidates both query keys', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    (apiClient.delete as Mock).mockResolvedValue(undefined);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRevokeQualification(), { wrapper });
    result.current.mutate({ staffId: 'u1', serviceId: 's1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith(
      '/staff/u1/qualifications/s1',
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: qualificationKeys.staffQualifications('u1'),
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: qualificationKeys.serviceQualifiedStaff('s1'),
      }),
    );
  });
});

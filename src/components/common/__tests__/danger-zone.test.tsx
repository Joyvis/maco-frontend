import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Mock } from 'vitest';

import { AuthContext } from '@/providers/auth-provider';
import { apiClient } from '@/services/api-client';
import type { AuthContextValue, User } from '@/types/auth';
import type { Tenant } from '@/types/tenant';

import { DangerZone } from '../danger-zone';

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
  },
  configureAuth: vi.fn(),
  resetAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Empresa Teste',
  account_type: 'standard',
  status: 'active',
};

const SUSPENDED_TENANT: Tenant = { ...MOCK_TENANT, status: 'suspended' };

function makeUser(permissions: User['permissions']): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    tenant_id: 'tenant-1',
    roles: ['admin'],
    permissions,
  };
}

function makeWrapper(user: User | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const authValue: AuthContextValue = {
    user,
    tenant: user?.tenant_id ?? null,
    isAuthenticated: user !== null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthContext.Provider>
    );
  };
}

describe('DangerZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when user has no danger-zone permissions', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    const user = makeUser([]);
    const { container } = render(<DangerZone tenantId="tenant-1" />, {
      wrapper: makeWrapper(user),
    });
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('shows Suspender button for user with tenants:suspend permission on active tenant', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    const user = makeUser([{ resource: 'tenants', action: 'suspend' }]);
    render(<DangerZone tenantId="tenant-1" />, { wrapper: makeWrapper(user) });

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Suspender Tenant' }),
      ).toBeInTheDocument(),
    );
  });

  it('hides Suspender button when tenant is not active', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: SUSPENDED_TENANT });
    const user = makeUser([{ resource: 'tenants', action: 'suspend' }]);
    render(<DangerZone tenantId="tenant-1" />, { wrapper: makeWrapper(user) });

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Suspender Tenant' }),
      ).toBeNull(),
    );
  });

  it('shows Cancelar button for user with tenants:cancel permission', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    const user = makeUser([{ resource: 'tenants', action: 'cancel' }]);
    render(<DangerZone tenantId="tenant-1" />, { wrapper: makeWrapper(user) });

    await waitFor(() =>
      expect(screen.getByTestId('cancel-trigger')).toBeInTheDocument(),
    );
  });

  it('shows Reativar button for user with tenants:reactivate permission on suspended tenant', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: SUSPENDED_TENANT });
    const user = makeUser([{ resource: 'tenants', action: 'reactivate' }]);
    render(<DangerZone tenantId="tenant-1" />, { wrapper: makeWrapper(user) });

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reativar Tenant' }),
      ).toBeInTheDocument(),
    );
  });

  it('cancel requires 2-step confirmation', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    const user = makeUser([{ resource: 'tenants', action: 'cancel' }]);
    render(<DangerZone tenantId="tenant-1" />, { wrapper: makeWrapper(user) });

    // Step 1: click the trigger
    await waitFor(() =>
      expect(screen.getByTestId('cancel-trigger')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('cancel-trigger'));

    // Step 1 dialog appears
    expect(screen.getByTestId('cancel-step1-confirm')).toBeInTheDocument();

    // Advance to step 2
    await userEvent.click(screen.getByTestId('cancel-step1-confirm'));
    expect(screen.getByTestId('cancel-step2-confirm')).toBeInTheDocument();

    // Confirm button is disabled until "CANCELAR" is typed
    expect(screen.getByTestId('cancel-step2-confirm')).toBeDisabled();

    const confirmInput = screen.getByLabelText('Confirmação de cancelamento');
    await userEvent.type(confirmInput, 'CANCELAR');
    expect(screen.getByTestId('cancel-step2-confirm')).not.toBeDisabled();
  });

  it('calls POST /tenants/:id/cancel and shows toast on successful cancel', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...MOCK_TENANT, status: 'cancelled' },
    });
    const { toast } = await import('sonner');
    const user = makeUser([{ resource: 'tenants', action: 'cancel' }]);
    render(<DangerZone tenantId="tenant-1" />, { wrapper: makeWrapper(user) });

    await userEvent.click(await screen.findByTestId('cancel-trigger'));
    await userEvent.click(screen.getByTestId('cancel-step1-confirm'));

    const confirmInput = screen.getByLabelText('Confirmação de cancelamento');
    await userEvent.type(confirmInput, 'CANCELAR');
    await userEvent.click(screen.getByTestId('cancel-step2-confirm'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/tenants/tenant-1/cancel');
    });
    expect(toast.success).toHaveBeenCalledWith('Tenant cancelado com sucesso');
  });

  it('shows toast on suspend success', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...MOCK_TENANT, status: 'suspended' },
    });
    const { toast } = await import('sonner');
    const user = makeUser([{ resource: 'tenants', action: 'suspend' }]);
    render(<DangerZone tenantId="tenant-1" />, { wrapper: makeWrapper(user) });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Suspender Tenant' }),
    );
    // ConfirmDialog opens
    await userEvent.click(
      await screen.findByRole('button', { name: 'Suspender' }),
    );

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/tenants/tenant-1/suspend');
    });
    expect(toast.success).toHaveBeenCalledWith('Tenant suspenso com sucesso');
  });
});

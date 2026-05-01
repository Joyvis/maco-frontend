import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { Tenant } from '@/types/tenant';

import { TenantProfileForm } from '../tenant-profile-form';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
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
  contact_email: 'contato@empresa.com',
  contact_phone: '+55 11 99999-9999',
};

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

function renderForm(tenantId = 'tenant-1') {
  return render(<TenantProfileForm tenantId={tenantId} />, {
    wrapper: makeWrapper(),
  });
}

describe('TenantProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching tenant', () => {
    (apiClient.get as Mock).mockReturnValue(new Promise(() => {}));
    renderForm();
    expect(
      screen.getByRole('status', { name: 'Carregando perfil' }),
    ).toBeInTheDocument();
  });

  it('displays read-only tenant id and account type after load', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    renderForm();

    await waitFor(() =>
      expect(screen.getByText('tenant-1')).toBeInTheDocument(),
    );
    expect(screen.getByText('standard')).toBeInTheDocument();
  });

  it('populates editable fields with tenant data', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    renderForm();

    const nameInput = await screen.findByRole('textbox', {
      name: /Nome do Tenant/i,
    });
    expect(nameInput).toHaveValue('Empresa Teste');

    const emailInput = screen.getByRole('textbox', {
      name: /E-mail de Contato/i,
    });
    expect(emailInput).toHaveValue('contato@empresa.com');
  });

  it('submits PATCH with form data on save', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    (apiClient.patch as Mock).mockResolvedValue({ data: MOCK_TENANT });
    const { toast } = await import('sonner');

    renderForm();

    const nameInput = await screen.findByRole('textbox', {
      name: /Nome do Tenant/i,
    });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Novo Nome');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/tenants/tenant-1',
        expect.objectContaining({ name: 'Novo Nome' }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Perfil salvo com sucesso');
  });

  it('shows error toast when update fails', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    (apiClient.patch as Mock).mockRejectedValue(new Error('Network error'));
    const { toast } = await import('sonner');

    renderForm();

    await screen.findByRole('textbox', { name: /Nome do Tenant/i });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao salvar perfil. Tente novamente.',
      );
    });
  });

  it('shows validation error when name is empty', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: MOCK_TENANT });
    renderForm();

    const nameInput = await screen.findByRole('textbox', {
      name: /Nome do Tenant/i,
    });
    await userEvent.clear(nameInput);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    });
  });
});

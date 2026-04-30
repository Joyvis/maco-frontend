import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { Role } from '@/types/user-management';
import type { ApiResponse } from '@/types/api';

import { InviteUserForm } from '../_components/invite-user-form';

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
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

const { mockToastSuccess } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: vi.fn() },
}));

const MOCK_ROLES: Role[] = [
  { id: 'r1', name: 'Admin' },
  { id: 'r2', name: 'Operador' },
];

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

beforeEach(() => {
  vi.clearAllMocks();
  const rolesResponse: ApiResponse<Role[]> = { data: MOCK_ROLES };
  (apiClient.get as Mock).mockResolvedValue(rolesResponse);
});

describe('AC: Invite form validates required fields', () => {
  it('shows "E-mail é obrigatório" when email is empty', async () => {
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    expect(await screen.findByText('E-mail é obrigatório')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('shows email format error', async () => {
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'notanemail');
    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    expect(
      await screen.findByText('Formato de e-mail inválido'),
    ).toBeInTheDocument();
  });

  it('shows role required error when no role selected', async () => {
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'novo@example.com');
    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    expect(
      await screen.findByText('Selecione pelo menos um papel'),
    ).toBeInTheDocument();
  });
});

describe('AC: Invite sends and shows success feedback', () => {
  it('calls POST /users/invite with correct data', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: { id: 'inv-1' } });
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'novo@example.com');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/users/invite',
        expect.objectContaining({
          email: 'novo@example.com',
          role_ids: ['r1'],
        }),
      ),
    );
  });

  it('shows success toast after invite', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: { id: 'inv-1' } });
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'novo@example.com');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Convite enviado com sucesso',
      ),
    );
  });

  it('resets form after successful invite', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: { id: 'inv-1' } });
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    const emailInput = screen.getByLabelText(/^e-mail/i);
    await userEvent.type(emailInput, 'novo@example.com');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
    expect((emailInput as HTMLInputElement).value).toBe('');
  });

  it('shows error alert when API fails', async () => {
    (apiClient.post as Mock).mockRejectedValue(
      new Error('E-mail já convidado'),
    );
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'novo@example.com');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail já convidado',
    );
  });

  it('sends optional message when provided', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: { id: 'inv-1' } });
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'novo@example.com');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.type(
      screen.getByLabelText(/mensagem/i),
      'Bem-vindo à equipe!',
    );

    await userEvent.click(
      screen.getByRole('button', { name: /enviar convite/i }),
    );

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/users/invite',
        expect.objectContaining({ message: 'Bem-vindo à equipe!' }),
      ),
    );
  });
});

describe('AC: Role selector shows available roles from API', () => {
  it('renders role checkboxes from API', async () => {
    render(<InviteUserForm />, { wrapper: makeWrapper() });

    expect(await screen.findByLabelText('Admin')).toBeInTheDocument();
    expect(screen.getByLabelText('Operador')).toBeInTheDocument();
  });
});

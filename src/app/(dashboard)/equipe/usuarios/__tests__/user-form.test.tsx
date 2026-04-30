import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import type { ManagedUser, Role } from '@/types/user-management';
import type { ApiResponse } from '@/types/api';

import { UserForm } from '../_components/user-form';

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

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const MOCK_ROLES: Role[] = [
  { id: 'r1', name: 'Admin' },
  { id: 'r2', name: 'Operador' },
];

const MOCK_USER: ManagedUser = {
  id: '1',
  name: 'João Silva',
  email: 'joao@example.com',
  roles: [{ id: 'r1', name: 'Admin' }],
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
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

beforeEach(() => {
  vi.clearAllMocks();
  const rolesResponse: ApiResponse<Role[]> = { data: MOCK_ROLES };
  (apiClient.get as Mock).mockResolvedValue(rolesResponse);
});

describe('AC: Create user form validates required fields', () => {
  it('shows "Nome é obrigatório" when name is empty', async () => {
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    expect(await screen.findByText('Nome é obrigatório')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('shows "E-mail é obrigatório" when email is empty', async () => {
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^nome/i), 'João');
    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    expect(await screen.findByText('E-mail é obrigatório')).toBeInTheDocument();
  });

  it('shows invalid email error', async () => {
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'notanemail');
    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    expect(
      await screen.findByText('Formato de e-mail inválido'),
    ).toBeInTheDocument();
  });

  it('shows password length error', async () => {
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'joao@ex.com');
    await userEvent.type(screen.getByLabelText(/^senha/i), 'short');
    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    expect(
      await screen.findByText('A senha deve ter pelo menos 8 caracteres'),
    ).toBeInTheDocument();
  });

  it('shows role error when no role selected', async () => {
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'joao@ex.com');
    await userEvent.type(screen.getByLabelText(/^senha/i), 'senha12345');
    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    expect(
      await screen.findByText('Selecione pelo menos um papel'),
    ).toBeInTheDocument();
  });
});

describe('AC: Create user form submits correctly', () => {
  it('calls POST /users with form data on valid submit', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: MOCK_USER });
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^nome/i), 'João Silva');
    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'joao@example.com');
    await userEvent.type(screen.getByLabelText(/^senha/i), 'senha12345');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@example.com',
          password: 'senha12345',
          role_ids: ['r1'],
        }),
      ),
    );
  });

  it('redirects to /equipe/usuarios on success', async () => {
    (apiClient.post as Mock).mockResolvedValue({ data: MOCK_USER });
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^nome/i), 'João Silva');
    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'joao@example.com');
    await userEvent.type(screen.getByLabelText(/^senha/i), 'senha12345');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/equipe/usuarios'),
    );
  });

  it('shows error alert when API fails', async () => {
    (apiClient.post as Mock).mockRejectedValue(
      new Error('E-mail já cadastrado'),
    );
    render(<UserForm mode="create" />, { wrapper: makeWrapper() });

    await userEvent.type(screen.getByLabelText(/^nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/^e-mail/i), 'joao@example.com');
    await userEvent.type(screen.getByLabelText(/^senha/i), 'senha12345');

    const adminCheckbox = await screen.findByLabelText('Admin');
    await userEvent.click(adminCheckbox);

    await userEvent.click(
      screen.getByRole('button', { name: /criar usuário/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail já cadastrado',
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('AC: Edit user pre-fills form with current data', () => {
  it('pre-fills name field with user data', async () => {
    render(<UserForm mode="edit" user={MOCK_USER} />, {
      wrapper: makeWrapper(),
    });

    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
  });

  it('shows email as read-only', async () => {
    render(<UserForm mode="edit" user={MOCK_USER} />, {
      wrapper: makeWrapper(),
    });

    const emailInput = screen.getByDisplayValue('joao@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('pre-selects existing roles', async () => {
    render(<UserForm mode="edit" user={MOCK_USER} />, {
      wrapper: makeWrapper(),
    });

    const adminCheckbox = await screen.findByLabelText('Admin');
    expect(adminCheckbox).toBeChecked();
  });

  it('calls PATCH /users/:id on submit', async () => {
    (apiClient.patch as Mock).mockResolvedValue({ data: MOCK_USER });
    render(<UserForm mode="edit" user={MOCK_USER} />, {
      wrapper: makeWrapper(),
    });

    const nameInput = screen.getByDisplayValue('João Silva');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'João Atualizado');

    await userEvent.click(
      screen.getByRole('button', { name: /salvar alterações/i }),
    );

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/users/1',
        expect.objectContaining({ name: 'João Atualizado' }),
      ),
    );
  });
});

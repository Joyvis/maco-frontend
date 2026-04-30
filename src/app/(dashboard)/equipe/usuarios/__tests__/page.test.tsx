import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Mock } from 'vitest';

import { apiClient } from '@/services/api-client';
import { PermissionsProvider } from '@/providers/permissions-provider';
import type { ManagedUser, Role } from '@/types/user-management';
import type { PaginatedResponse, ApiResponse } from '@/types/api';

import { UserTable } from '../_components/user-table';

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
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    toString: () => '',
  }),
  usePathname: () => '/equipe/usuarios',
}));

const MOCK_ROLES: Role[] = [
  { id: 'r1', name: 'Admin' },
  { id: 'r2', name: 'Operador' },
];

const MOCK_USERS: ManagedUser[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    roles: [{ id: 'r1', name: 'Admin' }],
    status: 'active',
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@example.com',
    roles: [{ id: 'r2', name: 'Operador' }],
    status: 'inactive',
    created_at: '2024-02-01T00:00:00Z',
  },
];

function makeWrapper(
  permissions = ['users:read', 'users:create', 'users:update'],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <PermissionsProvider permissions={permissions as never[]}>
          {children}
        </PermissionsProvider>
      </QueryClientProvider>
    );
  };
}

function mockApiResponses() {
  const usersResponse: PaginatedResponse<ManagedUser> = {
    data: MOCK_USERS,
    meta: { total: 2, page: 1, page_size: 100 },
  };
  const rolesResponse: ApiResponse<Role[]> = { data: MOCK_ROLES };

  (apiClient.get as Mock).mockImplementation((path: string) => {
    if (path === '/users') return Promise.resolve(usersResponse);
    if (path === '/roles') return Promise.resolve(rolesResponse);
    return Promise.reject(new Error('Unknown path'));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AC: User list loads with data', () => {
  it('renders user rows after loading', async () => {
    mockApiResponses();
    render(<UserTable />, { wrapper: makeWrapper() });

    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
  });

  it('shows Ativo and Inativo status badges', async () => {
    mockApiResponses();
    render(<UserTable />, { wrapper: makeWrapper() });

    await screen.findByText('João Silva');
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });
});

describe('AC: Search filters users by name or email', () => {
  it('filters by name — hides non-matching rows', async () => {
    mockApiResponses();
    render(<UserTable />, { wrapper: makeWrapper() });

    await screen.findByText('João Silva');

    const search = screen.getByRole('textbox', { name: /buscar usuários/i });
    await userEvent.type(search, 'Maria');

    await waitFor(() => expect(screen.queryByText('João Silva')).toBeNull());
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('filters by email', async () => {
    mockApiResponses();
    render(<UserTable />, { wrapper: makeWrapper() });

    await screen.findByText('João Silva');

    const search = screen.getByRole('textbox', { name: /buscar usuários/i });
    await userEvent.type(search, 'joao@');

    await waitFor(() => expect(screen.queryByText('Maria Santos')).toBeNull());
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });
});

describe('AC: Permission-based: hide create/edit if user lacks permission', () => {
  it('hides Criar usuário button without users:create permission', async () => {
    mockApiResponses();
    render(<UserTable />, { wrapper: makeWrapper(['users:read']) });

    await screen.findByText('João Silva');
    expect(screen.queryByText('Criar usuário')).toBeNull();
    expect(screen.queryByText('Convidar')).toBeNull();
  });

  it('shows Criar usuário button with users:create permission', async () => {
    mockApiResponses();
    render(<UserTable />, {
      wrapper: makeWrapper(['users:read', 'users:create']),
    });

    await screen.findByText('João Silva');
    expect(screen.getByText('Criar usuário')).toBeInTheDocument();
  });

  it('hides row actions without users:update permission', async () => {
    mockApiResponses();
    render(<UserTable />, { wrapper: makeWrapper(['users:read']) });

    await screen.findByText('João Silva');
    expect(screen.queryByRole('button', { name: 'Ações' })).toBeNull();
  });
});

describe('AC: Deactivate/reactivate with confirmation', () => {
  it('shows deactivate and reactivate buttons', async () => {
    mockApiResponses();
    render(<UserTable />, { wrapper: makeWrapper() });

    await screen.findByText('João Silva');

    const desativarBtns = screen.getAllByRole('button', { name: 'Desativar' });
    expect(desativarBtns.length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Reativar' }),
    ).toBeInTheDocument();
  });

  it('calls deactivate API on confirm', async () => {
    mockApiResponses();
    (apiClient.post as Mock).mockResolvedValue({
      data: { ...MOCK_USERS[0], status: 'inactive' },
    });

    render(<UserTable />, { wrapper: makeWrapper() });

    await screen.findByText('João Silva');

    const desativarBtns = screen.getAllByRole('button', { name: 'Desativar' });
    await userEvent.click(desativarBtns[0]!);

    const confirmBtn = await screen.findByRole('button', { name: 'Desativar' });
    await userEvent.click(confirmBtn);

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/users/1/deactivate'),
    );
  });
});

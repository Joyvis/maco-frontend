import { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Role, RoleUser } from '@/types/role';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/equipe/papeis/role-1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/roles', () => ({
  useRole: vi.fn(),
  useRoleUsers: vi.fn(),
  useUpdateRole: vi.fn(),
  useDeleteRole: vi.fn(),
}));

const mockRole: Role = {
  id: 'role-1',
  name: 'Editor',
  is_system: false,
  user_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  permissions: [{ resource: 'users', action: 'read' }],
};

const mockSystemRole: Role = {
  ...mockRole,
  id: 'sys-1',
  name: 'Administrador',
  is_system: true,
};

const mockRoleUsers: RoleUser[] = [
  { id: 'u1', name: 'João Silva', email: 'joao@example.com' },
  { id: 'u2', name: 'Maria Santos', email: 'maria@example.com' },
];

async function setup(role: Role, roleUsers: RoleUser[] = []) {
  const { useRole, useRoleUsers, useUpdateRole, useDeleteRole } =
    await vi.importMock<{
      useRole: ReturnType<typeof vi.fn>;
      useRoleUsers: ReturnType<typeof vi.fn>;
      useUpdateRole: ReturnType<typeof vi.fn>;
      useDeleteRole: ReturnType<typeof vi.fn>;
    }>('@/services/roles');

  useRole.mockReturnValue({ data: role, isLoading: false });
  useRoleUsers.mockReturnValue({ data: roleUsers, isLoading: false });
  useUpdateRole.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useDeleteRole.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });

  const { default: EditRolePage } = await import('../page');
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Suspense fallback={null}>
        <EditRolePage params={Promise.resolve({ id: role.id })} />
      </Suspense>,
    );
  });
  return result;
}

describe('EditRolePage', () => {
  it('renders tab navigation with Papel and Usuários tabs', async () => {
    await setup(mockRole);
    expect(screen.getByRole('tab', { name: /papel/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /usuários/i })).toBeInTheDocument();
  });

  it('shows role form in Papel tab by default', async () => {
    await setup(mockRole);
    expect(screen.getByLabelText(/nome do papel/i)).toBeInTheDocument();
  });

  it('shows assigned users list when Usuários tab is clicked', async () => {
    await setup(mockRole, mockRoleUsers);
    await userEvent.click(screen.getByRole('tab', { name: /usuários/i }));
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
  });

  it('shows empty state when no users are assigned', async () => {
    await setup(mockRole, []);
    await userEvent.click(screen.getByRole('tab', { name: /usuários/i }));
    expect(screen.getByText(/nenhum usuário atribuído/i)).toBeInTheDocument();
  });

  it('shows delete button for custom roles', async () => {
    await setup(mockRole);
    expect(
      screen.getByRole('button', { name: /excluir papel/i }),
    ).toBeInTheDocument();
  });

  it('hides delete button for system roles', async () => {
    await setup(mockSystemRole);
    expect(
      screen.queryByRole('button', { name: /excluir papel/i }),
    ).not.toBeInTheDocument();
  });

  it('shows read-only banner for system roles', async () => {
    await setup(mockSystemRole);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Role } from '@/types/role';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/equipe/papeis'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/roles', () => ({
  useRoles: vi.fn(),
  useDeleteRole: vi.fn(),
}));

const mockSystemRole: Role = {
  id: 'sys-1',
  name: 'Administrador',
  is_system: true,
  user_count: 10,
  created_at: '2024-01-01T00:00:00Z',
  permissions: [],
};

const mockCustomRole: Role = {
  id: 'cust-1',
  name: 'Editor',
  is_system: false,
  user_count: 3,
  created_at: '2024-06-01T00:00:00Z',
  permissions: [],
};

async function setup(roles: Role[]) {
  const { useRoles, useDeleteRole } = await vi.importMock<{
    useRoles: ReturnType<typeof vi.fn>;
    useDeleteRole: ReturnType<typeof vi.fn>;
  }>('@/services/roles');

  useRoles.mockReturnValue({
    data: roles,
    meta: { total: roles.length, page: 1, page_size: 10 },
    isLoading: false,
  });

  useDeleteRole.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });

  const { default: RolesPage } = await import('../page');
  return render(<RolesPage />);
}

describe('RolesPage', () => {
  it('renders role names in the table', async () => {
    await setup([mockSystemRole, mockCustomRole]);
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('shows Sistema badge for system roles', async () => {
    await setup([mockSystemRole]);
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });

  it('shows Personalizado badge for custom roles', async () => {
    await setup([mockCustomRole]);
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
  });

  it('renders create role button', async () => {
    await setup([]);
    expect(
      screen.getByRole('link', { name: /novo papel/i }),
    ).toBeInTheDocument();
  });

  it('shows edit action for custom roles', async () => {
    await setup([mockCustomRole]);
    const moreButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(moreButtons[0]!);
    expect(screen.getByText(/editar/i)).toBeInTheDocument();
  });

  it('hides delete action for system roles', async () => {
    await setup([mockSystemRole]);
    const moreButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(moreButtons[0]!);
    expect(screen.queryByText(/excluir/i)).not.toBeInTheDocument();
  });

  it('renders system roles before custom roles regardless of API order', async () => {
    await setup([mockCustomRole, mockSystemRole]);
    const rows = screen.getAllByRole('row');
    const rowTexts = rows.map((r) => r.textContent ?? '');
    const administradorIndex = rowTexts.findIndex((t) =>
      t.includes('Administrador'),
    );
    const editorIndex = rowTexts.findIndex((t) => t.includes('Editor'));
    expect(administradorIndex).toBeLessThan(editorIndex);
  });

  it('shows confirmation dialog when delete is clicked for custom role', async () => {
    await setup([mockCustomRole]);
    const moreButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(moreButtons[0]!);
    await userEvent.click(screen.getByText(/excluir/i));
    expect(await screen.findByText(/excluir papel/i)).toBeInTheDocument();
    expect(
      screen.getByText(/esta ação não pode ser desfeita/i),
    ).toBeInTheDocument();
  });
});

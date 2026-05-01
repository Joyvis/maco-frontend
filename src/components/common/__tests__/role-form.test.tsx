import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Role } from '@/types/role';

import { RoleForm } from '../role-form';

const mockRole: Role = {
  id: '1',
  name: 'Admin',
  is_system: true,
  user_count: 5,
  created_at: '2024-01-01T00:00:00Z',
  permissions: [{ resource: 'users', action: 'read' }],
};

const customRole: Role = {
  ...mockRole,
  id: '2',
  name: 'Editor',
  is_system: false,
};

describe('RoleForm', () => {
  it('renders the name field', () => {
    render(<RoleForm onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText(/nome do papel/i)).toBeInTheDocument();
  });

  it('renders the permission matrix', () => {
    render(<RoleForm onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('pre-fills name and permissions when role is provided', () => {
    render(<RoleForm role={customRole} onSubmit={vi.fn()} isLoading={false} />);
    const nameInput = screen.getByLabelText(
      /nome do papel/i,
    ) as HTMLInputElement;
    expect(nameInput.value).toBe('Editor');
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes.some((cb) => cb.checked)).toBe(true);
  });

  it('shows info banner and disables fields for system roles', () => {
    render(<RoleForm role={mockRole} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    const nameInput = screen.getByLabelText(
      /nome do papel/i,
    ) as HTMLInputElement;
    expect(nameInput).toBeDisabled();
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    checkboxes.forEach((cb) => expect(cb).toBeDisabled());
  });

  it('calls onSubmit with name and permissions', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RoleForm onSubmit={onSubmit} isLoading={false} />);

    await userEvent.type(screen.getByLabelText(/nome do papel/i), 'Novo Papel');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ name: 'Novo Papel' });
  });

  it('validates that name is required', async () => {
    render(<RoleForm onSubmit={vi.fn()} isLoading={false} />);
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<RoleForm onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
  });
});

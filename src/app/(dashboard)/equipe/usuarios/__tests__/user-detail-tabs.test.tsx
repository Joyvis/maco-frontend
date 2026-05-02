import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PermissionsProvider } from '@/providers/permissions-provider';
import type { Permission } from '@/types/permissions';
import type { ManagedUser } from '@/types/user-management';
import type { StaffQualification } from '@/types/qualification';
import type { Service } from '@/types/service';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/equipe/usuarios/u1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/users', () => ({
  useUser: vi.fn(),
  useDeactivateUser: vi.fn(),
  useReactivateUser: vi.fn(),
  useCreateUser: vi.fn(),
  useUpdateUser: vi.fn(),
}));

vi.mock('@/services/roles', () => ({
  useRoles: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/services/services', () => ({
  useServices: vi.fn(),
}));

vi.mock('@/services/qualifications', () => ({
  useStaffQualifications: vi.fn(),
  useGrantQualification: vi.fn(),
  useRevokeQualification: vi.fn(),
}));

const MOCK_USER: ManagedUser = {
  id: 'u1',
  name: 'João Silva',
  email: 'joao@example.com',
  roles: [{ id: 'r1', name: 'Staff' }],
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
};

const MOCK_QUALIFICATIONS: StaffQualification[] = [
  { service_id: 's1', service_name: 'Corte de Cabelo' },
  { service_id: 's2', service_name: 'Manicure' },
];

const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Corte de Cabelo', status: 'active' } as Service,
  { id: 's2', name: 'Manicure', status: 'active' } as Service,
  { id: 's3', name: 'Pedicure', status: 'active' } as Service,
];

function makeWrapper(
  permissions: Permission[] = [
    'qualifications:read',
    'qualifications:create',
    'qualifications:delete',
    'users:read',
    'users:update',
  ],
) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PermissionsProvider permissions={permissions}>
        {children}
      </PermissionsProvider>
    );
  };
}

async function setup(
  opts: {
    qualifications?: StaffQualification[];
    permissions?: Permission[];
  } = {},
) {
  const { qualifications = MOCK_QUALIFICATIONS, permissions } = opts;

  const { useUser, useDeactivateUser, useReactivateUser } =
    await vi.importMock<{
      useUser: ReturnType<typeof vi.fn>;
      useDeactivateUser: ReturnType<typeof vi.fn>;
      useReactivateUser: ReturnType<typeof vi.fn>;
    }>('@/services/users');

  const { useServices } = await vi.importMock<{
    useServices: ReturnType<typeof vi.fn>;
  }>('@/services/services');

  const {
    useStaffQualifications,
    useGrantQualification,
    useRevokeQualification,
  } = await vi.importMock<{
    useStaffQualifications: ReturnType<typeof vi.fn>;
    useGrantQualification: ReturnType<typeof vi.fn>;
    useRevokeQualification: ReturnType<typeof vi.fn>;
  }>('@/services/qualifications');

  const { useCreateUser, useUpdateUser } = await vi.importMock<{
    useCreateUser: ReturnType<typeof vi.fn>;
    useUpdateUser: ReturnType<typeof vi.fn>;
  }>('@/services/users');

  useUser.mockReturnValue({
    data: MOCK_USER,
    isLoading: false,
    isError: false,
  });
  useDeactivateUser.mockReturnValue({ mutateAsync: vi.fn() });
  useReactivateUser.mockReturnValue({ mutateAsync: vi.fn() });
  useCreateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useUpdateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useServices.mockReturnValue({ data: MOCK_SERVICES, isLoading: false });
  useStaffQualifications.mockReturnValue({
    data: qualifications,
    isLoading: false,
  });

  const grantMockFn = vi.fn().mockResolvedValue(undefined);
  const revokeMockFn = vi.fn().mockResolvedValue(undefined);
  useGrantQualification.mockReturnValue({ mutateAsync: grantMockFn });
  useRevokeQualification.mockReturnValue({ mutateAsync: revokeMockFn });

  const { UserDetailTabs } = await import('../_components/user-detail-tabs');
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<UserDetailTabs userId="u1" />, {
      wrapper: makeWrapper(permissions),
    });
  });
  return { result, grantMockFn, revokeMockFn };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserDetailTabs — tab navigation', () => {
  it('renders Dados and Qualificações tabs', async () => {
    await setup();
    expect(screen.getByRole('tab', { name: /dados/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /qualificações/i }),
    ).toBeInTheDocument();
  });
});

describe('UserDetailTabs — qualifications tab', () => {
  it('shows qualified services when Qualificações tab is clicked', async () => {
    await setup();
    await userEvent.click(screen.getByRole('tab', { name: /qualificações/i }));
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.getByText('Manicure')).toBeInTheDocument();
  });

  it('shows empty message when no qualifications exist', async () => {
    await setup({ qualifications: [] });
    await userEvent.click(screen.getByRole('tab', { name: /qualificações/i }));
    expect(
      screen.getByText('Nenhuma qualificação atribuída.'),
    ).toBeInTheDocument();
  });

  it('shows no-permission message when qualifications:read is missing', async () => {
    await setup({ permissions: ['users:read', 'users:update'] });
    await userEvent.click(screen.getByRole('tab', { name: /qualificações/i }));
    expect(
      screen.getByText(/não tem permissão para visualizar qualificações/i),
    ).toBeInTheDocument();
  });

  it('hides adder when qualifications:create is missing', async () => {
    await setup({
      permissions: ['qualifications:read', 'qualifications:delete'],
    });
    await userEvent.click(screen.getByRole('tab', { name: /qualificações/i }));
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('hides remove buttons when qualifications:delete is missing', async () => {
    await setup({
      permissions: ['qualifications:read', 'qualifications:create'],
    });
    await userEvent.click(screen.getByRole('tab', { name: /qualificações/i }));
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remover/i })).toBeNull();
  });

  it('calls revoke mutation when remove is confirmed', async () => {
    const { revokeMockFn } = await setup();
    await userEvent.click(screen.getByRole('tab', { name: /qualificações/i }));

    await userEvent.click(
      screen.getByRole('button', { name: /remover corte de cabelo/i }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Remover' }),
    );

    await waitFor(() =>
      expect(revokeMockFn).toHaveBeenCalledWith({
        staffId: 'u1',
        serviceId: 's1',
      }),
    );
  });
});

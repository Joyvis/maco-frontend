import React, { Suspense } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PermissionsProvider } from '@/providers/permissions-provider';
import type { Permission } from '@/types/permissions';
import type { Service } from '@/services/services';
import type { QualifiedStaff } from '@/types/qualification';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/servicos/s1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/services', () => ({
  useService: vi.fn(),
  useServices: vi.fn(),
}));

vi.mock('@/services/users', () => ({
  useUsers: vi.fn(),
}));

vi.mock('@/services/qualifications', () => ({
  useQualifiedStaff: vi.fn(),
  useGrantQualification: vi.fn(),
  useRevokeQualification: vi.fn(),
}));

const MOCK_SERVICE: Service = {
  id: 's1',
  name: 'Corte de Cabelo',
  status: 'active',
};

const MOCK_QUALIFIED_STAFF: QualifiedStaff[] = [
  { user_id: 'u1', name: 'João Silva', email: 'joao@example.com' },
];

const MOCK_USERS = [
  {
    id: 'u1',
    name: 'João Silva',
    email: 'joao@example.com',
    roles: [{ id: 'r1', name: 'Staff' }],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    name: 'Maria Santos',
    email: 'maria@example.com',
    roles: [{ id: 'r1', name: 'Staff' }],
    status: 'active' as const,
    created_at: '2024-01-01T00:00:00Z',
  },
];

function makeWrapper(
  permissions: Permission[] = [
    'qualifications:read',
    'qualifications:create',
    'qualifications:delete',
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
    service?: Service | null;
    qualifiedStaff?: QualifiedStaff[];
    permissions?: Permission[];
  } = {},
) {
  const {
    service = MOCK_SERVICE,
    qualifiedStaff = MOCK_QUALIFIED_STAFF,
    permissions,
  } = opts;

  const { useService, useServices } = await vi.importMock<{
    useService: ReturnType<typeof vi.fn>;
    useServices: ReturnType<typeof vi.fn>;
  }>('@/services/services');

  const { useUsers } = await vi.importMock<{
    useUsers: ReturnType<typeof vi.fn>;
  }>('@/services/users');

  const { useQualifiedStaff, useGrantQualification, useRevokeQualification } =
    await vi.importMock<{
      useQualifiedStaff: ReturnType<typeof vi.fn>;
      useGrantQualification: ReturnType<typeof vi.fn>;
      useRevokeQualification: ReturnType<typeof vi.fn>;
    }>('@/services/qualifications');

  useService.mockReturnValue({ data: service, isLoading: false });
  useQualifiedStaff.mockReturnValue({ data: qualifiedStaff, isLoading: false });
  useUsers.mockReturnValue({ data: MOCK_USERS, isLoading: false });
  useServices.mockReturnValue({ data: [], isLoading: false });
  const grantMockFn = vi.fn().mockResolvedValue(undefined);
  const revokeMockFn = vi.fn().mockResolvedValue(undefined);
  useGrantQualification.mockReturnValue({
    mutateAsync: grantMockFn,
    isPending: false,
  });
  useRevokeQualification.mockReturnValue({
    mutateAsync: revokeMockFn,
    isPending: false,
  });

  const { default: ServiceDetailPage } = await import('../page');
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Suspense fallback={null}>
        <ServiceDetailPage params={Promise.resolve({ id: 's1' })} />
      </Suspense>,
      { wrapper: makeWrapper(permissions) },
    );
  });
  return { result, grantMockFn, revokeMockFn };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ServiceDetailPage — layout', () => {
  it('renders Detalhes and Equipe Qualificada tabs', async () => {
    await setup();
    expect(screen.getByRole('tab', { name: /detalhes/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /equipe qualificada/i }),
    ).toBeInTheDocument();
  });

  it('shows service name in header', async () => {
    await setup();
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
  });

  it('shows not found message when service is null', async () => {
    await setup({ service: null });
    expect(screen.getByText(/serviço não encontrado/i)).toBeInTheDocument();
  });
});

describe('ServiceDetailPage — qualified staff tab', () => {
  it('shows qualified staff list when tab is clicked', async () => {
    await setup();
    await userEvent.click(
      screen.getByRole('tab', { name: /equipe qualificada/i }),
    );
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
  });

  it('shows empty state when no staff is qualified', async () => {
    await setup({ qualifiedStaff: [] });
    await userEvent.click(
      screen.getByRole('tab', { name: /equipe qualificada/i }),
    );
    expect(
      screen.getByText('Nenhum funcionário qualificado.'),
    ).toBeInTheDocument();
  });

  it('calls revoke mutation when remove is confirmed', async () => {
    const { revokeMockFn } = await setup();
    await userEvent.click(
      screen.getByRole('tab', { name: /equipe qualificada/i }),
    );

    const removeBtn = screen.getByRole('button', {
      name: /remover joão silva/i,
    });
    await userEvent.click(removeBtn);
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

  it('hides staff adder when qualifications:create is missing', async () => {
    await setup({
      permissions: ['qualifications:read', 'qualifications:delete'],
    });
    await userEvent.click(
      screen.getByRole('tab', { name: /equipe qualificada/i }),
    );
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('hides remove buttons when qualifications:delete is missing', async () => {
    await setup({
      permissions: ['qualifications:read', 'qualifications:create'],
    });
    await userEvent.click(
      screen.getByRole('tab', { name: /equipe qualificada/i }),
    );
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remover/i })).toBeNull();
  });

  it('shows no-permission message without qualifications:read', async () => {
    await setup({ permissions: [] });
    await userEvent.click(
      screen.getByRole('tab', { name: /equipe qualificada/i }),
    );
    expect(
      screen.getByText(/não tem permissão para visualizar qualificações/i),
    ).toBeInTheDocument();
  });
});

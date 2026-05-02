import React, { Suspense } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PermissionsProvider } from '@/providers/permissions-provider';
import type { Permission } from '@/types/permissions';
import type {
  Service,
  ServiceConsumption,
  ServiceDependency,
} from '@/types/service';
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
  useUpdateService: vi.fn(),
  useActivateService: vi.fn(),
  useArchiveService: vi.fn(),
  useConsumptions: vi.fn(),
  useAddConsumption: vi.fn(),
  useRemoveConsumption: vi.fn(),
  useDependencies: vi.fn(),
  useAddDependency: vi.fn(),
  useRemoveDependency: vi.fn(),
  useAllServices: vi.fn(),
}));

vi.mock('@/services/users', () => ({
  useUsers: vi.fn(),
}));

vi.mock('@/services/qualifications', () => ({
  useQualifiedStaff: vi.fn(),
  useGrantQualification: vi.fn(),
  useRevokeQualification: vi.fn(),
}));

vi.mock('@/services/products', () => ({
  useCategories: vi.fn(),
  useProducts: vi.fn(),
}));

// HEAD mock data — used by qualification tests
const MOCK_SERVICE = {
  id: 's1',
  name: 'Corte de Cabelo',
  status: 'active' as const,
} as Service;

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

// origin/main mock data — used by edit/lifecycle/consumption/dependency tests
const mockDraftService: Service = {
  id: 'svc-1',
  name: 'Corte de Cabelo',
  description: 'Um bom corte',
  category: 'cat-1',
  duration_minutes: 60,
  base_price: 50,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
} as Service;

const mockActiveService: Service = {
  ...mockDraftService,
  id: 'svc-2',
  name: 'Escova',
  status: 'active',
} as Service;

const mockArchivedService: Service = {
  ...mockDraftService,
  id: 'svc-3',
  name: 'Serviço Antigo',
  status: 'archived',
} as Service;

const mockConsumptions: ServiceConsumption[] = [
  { product_id: 'p-1', product_name: 'Shampoo Premium', quantity_per_use: 2 },
];

const mockDependencies: ServiceDependency[] = [
  {
    id: 'd-1',
    service_id: 'svc-4',
    service_name: 'Lavagem',
    auto_include: true,
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
    isLoading?: boolean;
  } = {},
) {
  const {
    service = MOCK_SERVICE,
    qualifiedStaff = MOCK_QUALIFIED_STAFF,
    permissions,
    isLoading = false,
  } = opts;

  const {
    useService,
    useServices,
    useUpdateService,
    useActivateService,
    useArchiveService,
    useConsumptions,
    useAddConsumption,
    useRemoveConsumption,
    useDependencies,
    useAddDependency,
    useRemoveDependency,
    useAllServices,
  } = await vi.importMock<{
    useService: ReturnType<typeof vi.fn>;
    useServices: ReturnType<typeof vi.fn>;
    useUpdateService: ReturnType<typeof vi.fn>;
    useActivateService: ReturnType<typeof vi.fn>;
    useArchiveService: ReturnType<typeof vi.fn>;
    useConsumptions: ReturnType<typeof vi.fn>;
    useAddConsumption: ReturnType<typeof vi.fn>;
    useRemoveConsumption: ReturnType<typeof vi.fn>;
    useDependencies: ReturnType<typeof vi.fn>;
    useAddDependency: ReturnType<typeof vi.fn>;
    useRemoveDependency: ReturnType<typeof vi.fn>;
    useAllServices: ReturnType<typeof vi.fn>;
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

  const { useCategories, useProducts } = await vi.importMock<{
    useCategories: ReturnType<typeof vi.fn>;
    useProducts: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  useService.mockReturnValue({ data: service ?? undefined, isLoading });
  useServices.mockReturnValue({ data: [], isLoading: false });
  useUpdateService.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useActivateService.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useArchiveService.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useConsumptions.mockReturnValue({ data: mockConsumptions, isLoading: false });
  useAddConsumption.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useRemoveConsumption.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useDependencies.mockReturnValue({ data: mockDependencies, isLoading: false });
  useAddDependency.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useRemoveDependency.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useAllServices.mockReturnValue({ data: [], isLoading: false });
  useCategories.mockReturnValue({ data: [], isLoading: false });
  useProducts.mockReturnValue({ data: [], isLoading: false });

  useQualifiedStaff.mockReturnValue({ data: qualifiedStaff, isLoading: false });
  useUsers.mockReturnValue({ data: MOCK_USERS, isLoading: false });
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
        <ServiceDetailPage
          params={Promise.resolve({ id: service?.id ?? 's1' })}
        />
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
  it('renders Informações, Consumos, Dependências and Equipe Qualificada tabs', async () => {
    await setup();
    expect(
      screen.getByRole('tab', { name: /informações/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /consumos/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /dependências/i }),
    ).toBeInTheDocument();
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

describe('ServiceDetailPage — edit / lifecycle / consumptions / dependencies', () => {
  it('shows loading state', async () => {
    await setup({ service: null, isLoading: true });
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('shows not found state when service is null', async () => {
    await setup({ service: null });
    expect(screen.getByText(/não encontrado/i)).toBeInTheDocument();
  });

  it('renders service name in the header', async () => {
    await setup({ service: mockDraftService });
    expect(screen.getByText(/corte de cabelo/i)).toBeInTheDocument();
  });

  it('renders form with pre-filled service name', async () => {
    await setup({ service: mockDraftService });
    const nameInput = screen.getByDisplayValue('Corte de Cabelo');
    expect(nameInput).toBeInTheDocument();
  });

  it('shows status badge for draft service', async () => {
    await setup({ service: mockDraftService });
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows Ativar button for draft services', async () => {
    await setup({ service: mockDraftService });
    expect(screen.getByRole('button', { name: /ativar/i })).toBeInTheDocument();
  });

  it('shows Arquivar button for draft services', async () => {
    await setup({ service: mockDraftService });
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('hides Ativar button for active services', async () => {
    await setup({ service: mockActiveService });
    expect(
      screen.queryByRole('button', { name: /ativar/i }),
    ).not.toBeInTheDocument();
  });

  it('shows Arquivar button for active services', async () => {
    await setup({ service: mockActiveService });
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('shows Ativar button for archived services (re-activate)', async () => {
    await setup({ service: mockArchivedService });
    expect(screen.getByRole('button', { name: /ativar/i })).toBeInTheDocument();
  });

  it('hides Arquivar button for archived services', async () => {
    await setup({ service: mockArchivedService });
    expect(
      screen.queryByRole('button', { name: /arquivar/i }),
    ).not.toBeInTheDocument();
  });

  it('shows active status badge for active services', async () => {
    await setup({ service: mockActiveService });
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('renders tabs for Informações, Consumos, Dependências', async () => {
    await setup({ service: mockDraftService });
    expect(
      screen.getByRole('tab', { name: /informações/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /consumos/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /dependências/i }),
    ).toBeInTheDocument();
  });

  it('shows consumptions after clicking Consumos tab', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    expect(screen.getByText(/shampoo premium/i)).toBeInTheDocument();
  });

  it('shows add consumption button in Consumos tab', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    expect(
      screen.getByRole('button', { name: /adicionar consumo/i }),
    ).toBeInTheDocument();
  });

  it('shows dependencies after clicking Dependências tab', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    expect(screen.getByText(/lavagem/i)).toBeInTheDocument();
  });

  it('shows add dependency button in Dependências tab', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    expect(
      screen.getByRole('button', { name: /adicionar dependência/i }),
    ).toBeInTheDocument();
  });

  it('shows add consumo form when clicking Adicionar Consumo', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar consumo/i }),
    );
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancelar/i }),
    ).toBeInTheDocument();
  });

  it('hides consumo form when clicking Cancelar', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar consumo/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(
      screen.getByRole('button', { name: /adicionar consumo/i }),
    ).toBeInTheDocument();
  });

  it('shows empty consumptions message when none exist', async () => {
    const {
      useService,
      useUpdateService,
      useActivateService,
      useArchiveService,
      useConsumptions,
      useAddConsumption,
      useRemoveConsumption,
      useDependencies,
      useAddDependency,
      useRemoveDependency,
      useAllServices,
    } = await vi.importMock<{
      useService: ReturnType<typeof vi.fn>;
      useUpdateService: ReturnType<typeof vi.fn>;
      useActivateService: ReturnType<typeof vi.fn>;
      useArchiveService: ReturnType<typeof vi.fn>;
      useConsumptions: ReturnType<typeof vi.fn>;
      useAddConsumption: ReturnType<typeof vi.fn>;
      useRemoveConsumption: ReturnType<typeof vi.fn>;
      useDependencies: ReturnType<typeof vi.fn>;
      useAddDependency: ReturnType<typeof vi.fn>;
      useRemoveDependency: ReturnType<typeof vi.fn>;
      useAllServices: ReturnType<typeof vi.fn>;
    }>('@/services/services');

    const { useCategories, useProducts } = await vi.importMock<{
      useCategories: ReturnType<typeof vi.fn>;
      useProducts: ReturnType<typeof vi.fn>;
    }>('@/services/products');

    const { useUsers } = await vi.importMock<{
      useUsers: ReturnType<typeof vi.fn>;
    }>('@/services/users');

    const { useQualifiedStaff, useGrantQualification, useRevokeQualification } =
      await vi.importMock<{
        useQualifiedStaff: ReturnType<typeof vi.fn>;
        useGrantQualification: ReturnType<typeof vi.fn>;
        useRevokeQualification: ReturnType<typeof vi.fn>;
      }>('@/services/qualifications');

    useService.mockReturnValue({ data: mockDraftService, isLoading: false });
    useUpdateService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useActivateService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useArchiveService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useConsumptions.mockReturnValue({ data: [], isLoading: false });
    useAddConsumption.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useRemoveConsumption.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useDependencies.mockReturnValue({
      data: mockDependencies,
      isLoading: false,
    });
    useAddDependency.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useRemoveDependency.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useAllServices.mockReturnValue({ data: [], isLoading: false });
    useCategories.mockReturnValue({ data: [], isLoading: false });
    useProducts.mockReturnValue({ data: [], isLoading: false });
    useUsers.mockReturnValue({ data: MOCK_USERS, isLoading: false });
    useQualifiedStaff.mockReturnValue({
      data: MOCK_QUALIFIED_STAFF,
      isLoading: false,
    });
    useGrantQualification.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useRevokeQualification.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    const { default: ServiceDetailPage } = await import('../page');
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ServiceDetailPage
            params={Promise.resolve({ id: mockDraftService.id })}
          />
        </Suspense>,
        { wrapper: makeWrapper() },
      );
    });

    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    expect(screen.getByText(/nenhum consumo cadastrado/i)).toBeInTheDocument();
  });

  it('shows add dependency form when clicking Adicionar Dependência', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar dependência/i }),
    );
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancelar/i }),
    ).toBeInTheDocument();
  });

  it('hides dependency form when clicking Cancelar', async () => {
    await setup({ service: mockDraftService });
    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar dependência/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(
      screen.getByRole('button', { name: /adicionar dependência/i }),
    ).toBeInTheDocument();
  });

  it('shows empty dependencies message when none exist', async () => {
    const {
      useService,
      useUpdateService,
      useActivateService,
      useArchiveService,
      useConsumptions,
      useAddConsumption,
      useRemoveConsumption,
      useDependencies,
      useAddDependency,
      useRemoveDependency,
      useAllServices,
    } = await vi.importMock<{
      useService: ReturnType<typeof vi.fn>;
      useUpdateService: ReturnType<typeof vi.fn>;
      useActivateService: ReturnType<typeof vi.fn>;
      useArchiveService: ReturnType<typeof vi.fn>;
      useConsumptions: ReturnType<typeof vi.fn>;
      useAddConsumption: ReturnType<typeof vi.fn>;
      useRemoveConsumption: ReturnType<typeof vi.fn>;
      useDependencies: ReturnType<typeof vi.fn>;
      useAddDependency: ReturnType<typeof vi.fn>;
      useRemoveDependency: ReturnType<typeof vi.fn>;
      useAllServices: ReturnType<typeof vi.fn>;
    }>('@/services/services');

    const { useCategories, useProducts } = await vi.importMock<{
      useCategories: ReturnType<typeof vi.fn>;
      useProducts: ReturnType<typeof vi.fn>;
    }>('@/services/products');

    const { useUsers } = await vi.importMock<{
      useUsers: ReturnType<typeof vi.fn>;
    }>('@/services/users');

    const { useQualifiedStaff, useGrantQualification, useRevokeQualification } =
      await vi.importMock<{
        useQualifiedStaff: ReturnType<typeof vi.fn>;
        useGrantQualification: ReturnType<typeof vi.fn>;
        useRevokeQualification: ReturnType<typeof vi.fn>;
      }>('@/services/qualifications');

    useService.mockReturnValue({ data: mockDraftService, isLoading: false });
    useUpdateService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useActivateService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useArchiveService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useConsumptions.mockReturnValue({
      data: mockConsumptions,
      isLoading: false,
    });
    useAddConsumption.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useRemoveConsumption.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useDependencies.mockReturnValue({ data: [], isLoading: false });
    useAddDependency.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useRemoveDependency.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useAllServices.mockReturnValue({ data: [], isLoading: false });
    useCategories.mockReturnValue({ data: [], isLoading: false });
    useProducts.mockReturnValue({ data: [], isLoading: false });
    useUsers.mockReturnValue({ data: MOCK_USERS, isLoading: false });
    useQualifiedStaff.mockReturnValue({
      data: MOCK_QUALIFIED_STAFF,
      isLoading: false,
    });
    useGrantQualification.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useRevokeQualification.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });

    const { default: ServiceDetailPage } = await import('../page');
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ServiceDetailPage
            params={Promise.resolve({ id: mockDraftService.id })}
          />
        </Suspense>,
        { wrapper: makeWrapper() },
      );
    });

    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    expect(
      screen.getByText(/nenhuma dependência cadastrada/i),
    ).toBeInTheDocument();
  });
});

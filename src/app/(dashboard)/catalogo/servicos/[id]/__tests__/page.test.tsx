import { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  Service,
  ServiceConsumption,
  ServiceDependency,
} from '@/types/service';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/servicos/svc-1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/services', () => ({
  useService: vi.fn(),
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

vi.mock('@/services/products', () => ({
  useCategories: vi.fn(),
  useProducts: vi.fn(),
}));

const mockDraftService: Service = {
  id: 'svc-1',
  name: 'Corte de Cabelo',
  description: 'Um bom corte',
  category: 'cat-1',
  duration_minutes: 60,
  base_price: 50,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

const mockActiveService: Service = {
  ...mockDraftService,
  id: 'svc-2',
  name: 'Escova',
  status: 'active',
};

const mockArchivedService: Service = {
  ...mockDraftService,
  id: 'svc-3',
  name: 'Serviço Antigo',
  status: 'archived',
};

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

async function setup(service: Service | null, isLoading = false) {
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

  useService.mockReturnValue({ data: service ?? undefined, isLoading });
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

  const { default: ServiceDetailPage } = await import('../page');
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Suspense fallback={null}>
        <ServiceDetailPage
          params={Promise.resolve({ id: service?.id ?? 'svc-1' })}
        />
      </Suspense>,
    );
  });
  return result;
}

describe('ServiceDetailPage', () => {
  it('shows loading state', async () => {
    await setup(null, true);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('shows not found state when service is null', async () => {
    await setup(null, false);
    expect(screen.getByText(/não encontrado/i)).toBeInTheDocument();
  });

  it('renders service name in the header', async () => {
    await setup(mockDraftService);
    expect(
      screen.getByText(/editar serviço: corte de cabelo/i),
    ).toBeInTheDocument();
  });

  it('renders form with pre-filled service name', async () => {
    await setup(mockDraftService);
    const nameInput = screen.getByDisplayValue('Corte de Cabelo');
    expect(nameInput).toBeInTheDocument();
  });

  it('shows status badge for draft service', async () => {
    await setup(mockDraftService);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows Ativar button for draft services', async () => {
    await setup(mockDraftService);
    expect(screen.getByRole('button', { name: /ativar/i })).toBeInTheDocument();
  });

  it('shows Arquivar button for draft services', async () => {
    await setup(mockDraftService);
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('hides Ativar button for active services', async () => {
    await setup(mockActiveService);
    expect(
      screen.queryByRole('button', { name: /ativar/i }),
    ).not.toBeInTheDocument();
  });

  it('shows Arquivar button for active services', async () => {
    await setup(mockActiveService);
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('shows Ativar button for archived services (re-activate)', async () => {
    await setup(mockArchivedService);
    expect(screen.getByRole('button', { name: /ativar/i })).toBeInTheDocument();
  });

  it('hides Arquivar button for archived services', async () => {
    await setup(mockArchivedService);
    expect(
      screen.queryByRole('button', { name: /arquivar/i }),
    ).not.toBeInTheDocument();
  });

  it('shows active status badge for active services', async () => {
    await setup(mockActiveService);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('renders tabs for Informações, Consumos, Dependências', async () => {
    await setup(mockDraftService);
    expect(
      screen.getByRole('tab', { name: /informações/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /consumos/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /dependências/i }),
    ).toBeInTheDocument();
  });

  it('shows consumptions after clicking Consumos tab', async () => {
    await setup(mockDraftService);
    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    expect(screen.getByText(/shampoo premium/i)).toBeInTheDocument();
  });

  it('shows add consumption button in Consumos tab', async () => {
    await setup(mockDraftService);
    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    expect(
      screen.getByRole('button', { name: /adicionar consumo/i }),
    ).toBeInTheDocument();
  });

  it('shows dependencies after clicking Dependências tab', async () => {
    await setup(mockDraftService);
    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    expect(screen.getByText(/lavagem/i)).toBeInTheDocument();
  });

  it('shows add dependency button in Dependências tab', async () => {
    await setup(mockDraftService);
    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    expect(
      screen.getByRole('button', { name: /adicionar dependência/i }),
    ).toBeInTheDocument();
  });

  it('shows add consumo form when clicking Adicionar Consumo', async () => {
    await setup(mockDraftService);
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
    await setup(mockDraftService);
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

    const { default: ServiceDetailPage } = await import('../page');
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ServiceDetailPage
            params={Promise.resolve({ id: mockDraftService.id })}
          />
        </Suspense>,
      );
    });

    await userEvent.click(screen.getByRole('tab', { name: /consumos/i }));
    expect(screen.getByText(/nenhum consumo cadastrado/i)).toBeInTheDocument();
  });

  it('shows add dependency form when clicking Adicionar Dependência', async () => {
    await setup(mockDraftService);
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
    await setup(mockDraftService);
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

    const { default: ServiceDetailPage } = await import('../page');
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ServiceDetailPage
            params={Promise.resolve({ id: mockDraftService.id })}
          />
        </Suspense>,
      );
    });

    await userEvent.click(screen.getByRole('tab', { name: /dependências/i }));
    expect(
      screen.getByText(/nenhuma dependência cadastrada/i),
    ).toBeInTheDocument();
  });
});

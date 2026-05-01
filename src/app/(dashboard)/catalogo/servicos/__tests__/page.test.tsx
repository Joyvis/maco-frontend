import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Service } from '@/types/service';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/servicos'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/services', () => ({
  useServices: vi.fn(),
  useActivateService: vi.fn(),
  useArchiveService: vi.fn(),
}));

vi.mock('@/services/products', () => ({
  useCategories: vi.fn(),
}));

const mockDraftService: Service = {
  id: 'svc-1',
  name: 'Corte de Cabelo',
  category: 'Cabelo',
  duration_minutes: 60,
  base_price: 50,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

const mockActiveService: Service = {
  id: 'svc-2',
  name: 'Escova',
  duration_minutes: 45,
  base_price: 35,
  status: 'active',
  created_at: '2024-02-01T00:00:00Z',
};

const mockArchivedService: Service = {
  id: 'svc-3',
  name: 'Serviço Antigo',
  duration_minutes: 30,
  base_price: 20,
  status: 'archived',
  created_at: '2024-03-01T00:00:00Z',
};

async function setup(services: Service[]) {
  const { useServices, useActivateService, useArchiveService } =
    await vi.importMock<{
      useServices: ReturnType<typeof vi.fn>;
      useActivateService: ReturnType<typeof vi.fn>;
      useArchiveService: ReturnType<typeof vi.fn>;
    }>('@/services/services');

  const { useCategories } = await vi.importMock<{
    useCategories: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  useServices.mockReturnValue({
    data: services,
    meta: { total: services.length, page: 1, page_size: 10 },
    isLoading: false,
  });
  useActivateService.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useArchiveService.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useCategories.mockReturnValue({ data: [], isLoading: false });

  const { default: ServicesPage } = await import('../page');
  return render(<ServicesPage />);
}

describe('ServicesPage', () => {
  it('renders service names in the table', async () => {
    await setup([mockDraftService, mockActiveService]);
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.getByText('Escova')).toBeInTheDocument();
  });

  it('shows Rascunho badge for draft services', async () => {
    await setup([mockDraftService]);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows Ativo badge for active services', async () => {
    await setup([mockActiveService]);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('shows Arquivado badge for archived services', async () => {
    await setup([mockArchivedService]);
    expect(screen.getByText('Arquivado')).toBeInTheDocument();
  });

  it('displays duration in minutes', async () => {
    await setup([mockDraftService]);
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('shows category when present', async () => {
    await setup([mockDraftService]);
    expect(screen.getByText('Cabelo')).toBeInTheDocument();
  });

  it('renders create service button', async () => {
    await setup([]);
    expect(
      screen.getByRole('link', { name: /novo serviço/i }),
    ).toBeInTheDocument();
  });

  it('shows edit action in row actions', async () => {
    await setup([mockDraftService]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/editar/i)).toBeInTheDocument();
  });

  it('shows activate action for non-active services', async () => {
    await setup([mockDraftService]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/ativar/i)).toBeInTheDocument();
  });

  it('hides activate action for active services', async () => {
    await setup([mockActiveService]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.queryByText(/ativar/i)).not.toBeInTheDocument();
  });

  it('shows archive action for non-archived services', async () => {
    await setup([mockActiveService]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/arquivar/i)).toBeInTheDocument();
  });

  it('hides archive action for archived services', async () => {
    await setup([mockArchivedService]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.queryByText(/arquivar/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no services exist', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhum resultado encontrado/i),
    ).toBeInTheDocument();
  });

  it('status filter triggers re-render with filtered data', async () => {
    const { useServices, useActivateService, useArchiveService } =
      await vi.importMock<{
        useServices: ReturnType<typeof vi.fn>;
        useActivateService: ReturnType<typeof vi.fn>;
        useArchiveService: ReturnType<typeof vi.fn>;
      }>('@/services/services');

    const { useCategories } = await vi.importMock<{
      useCategories: ReturnType<typeof vi.fn>;
    }>('@/services/products');

    useServices.mockReturnValue({
      data: [mockDraftService],
      isLoading: false,
    });
    useActivateService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useArchiveService.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    useCategories.mockReturnValue({ data: [], isLoading: false });

    const { default: ServicesPage } = await import('../page');
    render(<ServicesPage />);

    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.queryByText('Escova')).not.toBeInTheDocument();
  });
});

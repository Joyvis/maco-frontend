import React, { Suspense } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  AdminSaleOrder,
  SaleOrderItem,
  SaleOrderPayment,
  SaleOrderHistoryEntry,
} from '@/types/order';

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_APP_NAME: 'Maco',
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/pedidos/ordens/ord-1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/orders', () => ({
  useOrder: vi.fn(),
  useOrderItems: vi.fn(),
  useOrderPayments: vi.fn(),
  useOrderHistory: vi.fn(),
  useCheckIn: vi.fn(),
  useStartService: vi.fn(),
  useCompleteOrder: vi.fn(),
  useCancelOrder: vi.fn(),
  useNoShowOrder: vi.fn(),
}));

const mockOrder: AdminSaleOrder = {
  id: 'ord-1',
  order_number: 'ORD-001',
  state: 'confirmed',
  customer_name: 'Ana Silva',
  assigned_staff: 'João Barbeiro',
  created_at: '2026-05-01T00:00:00Z',
  balance_due: 0,
  total_amount: 150,
};

const mockItem: SaleOrderItem = {
  id: 'item-1',
  service_id: 'svc-1',
  service_name: 'Corte de Cabelo',
  quantity: 1,
  price_snapshot: 150,
  subtotal: 150,
};

const mockPayment: SaleOrderPayment = {
  id: 'pay-1',
  amount: 150,
  status: 'paid',
  method: 'Cartão de Crédito',
  created_at: '2026-05-01T10:00:00Z',
};

const mockHistoryEntry: SaleOrderHistoryEntry = {
  id: 'hist-1',
  from_state: null,
  to_state: 'confirmed',
  actor: 'Sistema',
  created_at: '2026-05-01T00:00:00Z',
};

async function setupMocks(
  order: AdminSaleOrder | null,
  overrides?: {
    items?: SaleOrderItem[];
    payments?: SaleOrderPayment[];
    history?: SaleOrderHistoryEntry[];
    checkInMock?: ReturnType<typeof vi.fn>;
    cancelMock?: ReturnType<typeof vi.fn>;
    noShowMock?: ReturnType<typeof vi.fn>;
  },
) {
  const {
    useOrder,
    useOrderItems,
    useOrderPayments,
    useOrderHistory,
    useCheckIn,
    useStartService,
    useCompleteOrder,
    useCancelOrder,
    useNoShowOrder,
  } = await vi.importMock<{
    useOrder: ReturnType<typeof vi.fn>;
    useOrderItems: ReturnType<typeof vi.fn>;
    useOrderPayments: ReturnType<typeof vi.fn>;
    useOrderHistory: ReturnType<typeof vi.fn>;
    useCheckIn: ReturnType<typeof vi.fn>;
    useStartService: ReturnType<typeof vi.fn>;
    useCompleteOrder: ReturnType<typeof vi.fn>;
    useCancelOrder: ReturnType<typeof vi.fn>;
    useNoShowOrder: ReturnType<typeof vi.fn>;
  }>('@/services/orders');

  const checkInMutateMock =
    overrides?.checkInMock ?? vi.fn().mockResolvedValue(undefined);
  const cancelMutateMock =
    overrides?.cancelMock ?? vi.fn().mockResolvedValue(undefined);
  const noShowMutateMock =
    overrides?.noShowMock ?? vi.fn().mockResolvedValue(undefined);

  const noopMutation = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };

  useOrder.mockReturnValue({ data: order ?? undefined, isLoading: false });
  useOrderItems.mockReturnValue({
    data: overrides?.items ?? [],
    isLoading: false,
  });
  useOrderPayments.mockReturnValue({
    data: overrides?.payments ?? [],
    isLoading: false,
  });
  useOrderHistory.mockReturnValue({
    data: overrides?.history ?? [],
    isLoading: false,
  });
  useCheckIn.mockReturnValue({
    mutateAsync: checkInMutateMock,
    isPending: false,
  });
  useStartService.mockReturnValue(noopMutation);
  useCompleteOrder.mockReturnValue(noopMutation);
  useCancelOrder.mockReturnValue({
    mutateAsync: cancelMutateMock,
    isPending: false,
  });
  useNoShowOrder.mockReturnValue({
    mutateAsync: noShowMutateMock,
    isPending: false,
  });

  return { checkInMutateMock, cancelMutateMock, noShowMutateMock };
}

async function setup(
  order: AdminSaleOrder | null = mockOrder,
  overrides?: {
    items?: SaleOrderItem[];
    payments?: SaleOrderPayment[];
    history?: SaleOrderHistoryEntry[];
    checkInMock?: ReturnType<typeof vi.fn>;
    cancelMock?: ReturnType<typeof vi.fn>;
    noShowMock?: ReturnType<typeof vi.fn>;
  },
) {
  const mocks = await setupMocks(order, overrides);
  const { default: OrderDetailPage } = await import('../page');

  await act(async () => {
    render(
      <Suspense fallback={null}>
        <OrderDetailPage params={Promise.resolve({ id: 'ord-1' })} />
      </Suspense>,
    );
  });

  return mocks;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OrderDetailPage — layout', () => {
  it('shows order number in the header', async () => {
    await setup();
    expect(screen.getByText(/pedido #ORD-001/i)).toBeInTheDocument();
  });

  it('shows customer name', async () => {
    await setup();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });

  it('shows assigned staff', async () => {
    await setup();
    expect(screen.getByText('João Barbeiro')).toBeInTheDocument();
  });

  it('shows state badge for confirmed order', async () => {
    await setup();
    expect(screen.getAllByText('Confirmado').length).toBeGreaterThan(0);
  });

  it('shows not found message when order is null', async () => {
    await setup(null);
    expect(screen.getByText(/ordem não encontrada/i)).toBeInTheDocument();
  });

  it('renders state progress bar', async () => {
    await setup();
    expect(screen.getByLabelText('Progresso do pedido')).toBeInTheDocument();
  });

  it('renders tabs: Itens, Pagamentos, Histórico', async () => {
    await setup();
    expect(screen.getByRole('tab', { name: /itens/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /pagamentos/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /histórico/i })).toBeInTheDocument();
  });
});

describe('OrderDetailPage — workflow actions', () => {
  it('shows Check-in button for confirmed state', async () => {
    await setup(mockOrder);
    expect(
      screen.getByRole('button', { name: /realizar check-in/i }),
    ).toBeInTheDocument();
  });

  it('does not show Check-in button for in_progress state', async () => {
    await setup({ ...mockOrder, state: 'in_progress' });
    expect(
      screen.queryByRole('button', { name: /realizar check-in/i }),
    ).toBeNull();
  });

  it('shows Start Service button for checked_in state', async () => {
    await setup({ ...mockOrder, state: 'checked_in' });
    expect(
      screen.getByRole('button', { name: /iniciar atendimento/i }),
    ).toBeInTheDocument();
  });

  it('shows Complete button for pending_checkout state when balance_due is 0', async () => {
    await setup({ ...mockOrder, state: 'pending_checkout', balance_due: 0 });
    expect(
      screen.getByRole('button', { name: /concluir pedido/i }),
    ).toBeInTheDocument();
  });

  it('disables Complete button when balance_due > 0', async () => {
    await setup({ ...mockOrder, state: 'pending_checkout', balance_due: 50 });
    expect(
      screen.getByRole('button', { name: /concluir pedido/i }),
    ).toBeDisabled();
  });

  it('shows Cancel button for confirmed state', async () => {
    await setup(mockOrder);
    expect(
      screen.getByRole('button', { name: /cancelar pedido/i }),
    ).toBeInTheDocument();
  });

  it('does not show Cancel button for completed state', async () => {
    await setup({ ...mockOrder, state: 'completed' });
    expect(
      screen.queryByRole('button', { name: /cancelar pedido/i }),
    ).toBeNull();
  });

  it('shows No-show button for confirmed state', async () => {
    await setup(mockOrder);
    expect(
      screen.getByRole('button', { name: /não compareceu/i }),
    ).toBeInTheDocument();
  });

  it('shows No-show button for checked_in state', async () => {
    await setup({ ...mockOrder, state: 'checked_in' });
    expect(
      screen.getByRole('button', { name: /não compareceu/i }),
    ).toBeInTheDocument();
  });

  it('does not show No-show button for completed state', async () => {
    await setup({ ...mockOrder, state: 'completed' });
    expect(
      screen.queryByRole('button', { name: /não compareceu/i }),
    ).toBeNull();
  });

  it('shows no workflow buttons for completed state', async () => {
    await setup({ ...mockOrder, state: 'completed' });
    expect(
      screen.queryByRole('button', { name: /realizar check-in/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /iniciar atendimento/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /concluir pedido/i }),
    ).toBeNull();
  });

  it('calls checkIn mutation when Check-in button clicked', async () => {
    const checkInMock = vi.fn().mockResolvedValue(undefined);
    await setup(mockOrder, { checkInMock });
    await userEvent.click(
      screen.getByRole('button', { name: /realizar check-in/i }),
    );
    await waitFor(() => expect(checkInMock).toHaveBeenCalledWith('ord-1'));
  });
});

describe('OrderDetailPage — cancel dialog', () => {
  it('cancel dialog disables confirm when reason is empty', async () => {
    await setup(mockOrder);
    await userEvent.click(
      screen.getByRole('button', { name: /cancelar pedido/i }),
    );
    const confirmBtn = screen.getByRole('button', {
      name: /confirmar cancelamento/i,
    });
    expect(confirmBtn).toBeDisabled();
  });

  it('cancel dialog enables confirm when reason is filled', async () => {
    await setup(mockOrder);
    await userEvent.click(
      screen.getByRole('button', { name: /cancelar pedido/i }),
    );
    const textarea = screen.getByLabelText(/motivo/i);
    await userEvent.type(textarea, 'Cliente desistiu');
    expect(
      screen.getByRole('button', { name: /confirmar cancelamento/i }),
    ).not.toBeDisabled();
  });
});

describe('OrderDetailPage — tabs', () => {
  it('renders items tab with service name and subtotal', async () => {
    await setup(mockOrder, { items: [mockItem] });
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    const cells = screen.getAllByText(/R\$\s*150/);
    expect(cells.length).toBeGreaterThan(0);
  });

  it('shows empty state in items tab when no items', async () => {
    await setup(mockOrder, { items: [] });
    expect(screen.getByText(/nenhum item encontrado/i)).toBeInTheDocument();
  });

  it('renders payments after clicking Pagamentos tab', async () => {
    await setup(mockOrder, { payments: [mockPayment] });
    const tab = screen.getByRole('tab', { name: /pagamentos/i });
    await userEvent.click(tab);
    await waitFor(() =>
      expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument(),
    );
  });

  it('shows empty state in payments tab when no payments', async () => {
    await setup(mockOrder, { payments: [] });
    const tab = screen.getByRole('tab', { name: /pagamentos/i });
    await userEvent.click(tab);
    await waitFor(() =>
      expect(
        screen.getByText(/nenhum pagamento registrado/i),
      ).toBeInTheDocument(),
    );
  });

  it('renders history entries after clicking Histórico tab', async () => {
    await setup(mockOrder, { history: [mockHistoryEntry] });
    const tab = screen.getByRole('tab', { name: /histórico/i });
    await userEvent.click(tab);
    await waitFor(() =>
      expect(screen.getByText('por Sistema')).toBeInTheDocument(),
    );
  });

  it('shows empty state in history tab when no entries', async () => {
    await setup(mockOrder, { history: [] });
    const tab = screen.getByRole('tab', { name: /histórico/i });
    await userEvent.click(tab);
    await waitFor(() =>
      expect(
        screen.getByText(/nenhuma transição registrada/i),
      ).toBeInTheDocument(),
    );
  });
});

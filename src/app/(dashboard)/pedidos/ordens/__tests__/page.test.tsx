import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AdminSaleOrder } from '@/types/order';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/pedidos/ordens'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/orders', () => ({
  useOrders: vi.fn(),
}));

const mockConfirmedOrder: AdminSaleOrder = {
  id: 'ord-1',
  order_number: 'ORD-001',
  state: 'confirmed',
  customer_name: 'Ana Silva',
  assigned_staff: 'João Barbeiro',
  created_at: '2026-05-01T00:00:00Z',
  balance_due: 0,
  total_amount: 150,
};

const mockCompletedOrder: AdminSaleOrder = {
  id: 'ord-2',
  order_number: 'ORD-002',
  state: 'completed',
  customer_name: 'Carlos Mendes',
  assigned_staff: undefined,
  created_at: '2026-05-02T00:00:00Z',
  balance_due: 0,
  total_amount: 80,
};

const mockCancelledOrder: AdminSaleOrder = {
  id: 'ord-3',
  order_number: 'ORD-003',
  state: 'cancelled',
  customer_name: 'Maria Souza',
  assigned_staff: 'Lucia Estetista',
  created_at: '2026-05-03T00:00:00Z',
  balance_due: 0,
  total_amount: 60,
};

async function setup(orders: AdminSaleOrder[]) {
  const { useOrders } = await vi.importMock<{
    useOrders: ReturnType<typeof vi.fn>;
  }>('@/services/orders');

  useOrders.mockReturnValue({ data: orders, isLoading: false });

  const { default: OrdensPage } = await import('../page');
  return render(<OrdensPage />);
}

describe('OrdensPage', () => {
  it('renders customer names in the table', async () => {
    await setup([mockConfirmedOrder, mockCompletedOrder]);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendes')).toBeInTheDocument();
  });

  it('renders order numbers with # prefix', async () => {
    await setup([mockConfirmedOrder]);
    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
  });

  it('renders assigned staff or dash when absent', async () => {
    await setup([mockConfirmedOrder, mockCompletedOrder]);
    expect(screen.getByText('João Barbeiro')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows Confirmado badge for confirmed orders', async () => {
    await setup([mockConfirmedOrder]);
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('shows Concluído badge for completed orders', async () => {
    await setup([mockCompletedOrder]);
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('shows Cancelado badge for cancelled orders', async () => {
    await setup([mockCancelledOrder]);
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('shows total formatted as BRL currency', async () => {
    await setup([mockConfirmedOrder]);
    expect(screen.getByText(/R\$\s*150/)).toBeInTheDocument();
  });

  it('shows empty state when no orders exist', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhum resultado encontrado/i),
    ).toBeInTheDocument();
  });

  it('shows loading text while fetching', async () => {
    const { useOrders } = await vi.importMock<{
      useOrders: ReturnType<typeof vi.fn>;
    }>('@/services/orders');
    useOrders.mockReturnValue({ data: [], isLoading: true });

    const { default: OrdensPage } = await import('../page');
    render(<OrdensPage />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('shows actions dropdown with Ver detalhes option', async () => {
    await setup([mockConfirmedOrder]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/ver detalhes/i)).toBeInTheDocument();
  });

  it('non-matching rows are absent after data changes', async () => {
    await setup([mockConfirmedOrder]);
    expect(screen.queryByText('Carlos Mendes')).toBeNull();
  });
});

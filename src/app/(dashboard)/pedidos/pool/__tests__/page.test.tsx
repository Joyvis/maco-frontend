import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ManagedSaleOrder } from '@/types/sale-order';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/pedidos/pool'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/sale-orders', () => ({
  useSaleOrderPool: vi.fn(),
  useClaimSaleOrder: vi.fn(),
}));

const mockPoolOrder: ManagedSaleOrder = {
  id: 'order-1',
  order_number: '001',
  customer_name: 'Carlos Pereira',
  state: 'confirmed',
  total_amount: 120.0,
  items: [],
  prepayment_required: false,
  created_at: '2024-01-15T00:00:00Z',
};

const mockPoolOrder2: ManagedSaleOrder = {
  id: 'order-2',
  order_number: '002',
  customer_name: 'Juliana Martins',
  state: 'confirmed',
  total_amount: 80.0,
  items: [],
  prepayment_required: false,
  created_at: '2024-01-16T00:00:00Z',
};

async function setup(orders: ManagedSaleOrder[], isClaiming = false) {
  const { useSaleOrderPool, useClaimSaleOrder } = await vi.importMock<{
    useSaleOrderPool: ReturnType<typeof vi.fn>;
    useClaimSaleOrder: ReturnType<typeof vi.fn>;
  }>('@/services/sale-orders');

  useSaleOrderPool.mockReturnValue({ data: orders, isLoading: false });
  useClaimSaleOrder.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: isClaiming,
  });

  const { default: OrderPoolPage } = await import('../page');
  return render(<OrderPoolPage />);
}

describe('OrderPoolPage', () => {
  it('renders page title', async () => {
    await setup([]);
    expect(screen.getByText('Pool de Ordens')).toBeInTheDocument();
  });

  it('shows empty message when no orders in pool', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhuma ordem disponível no pool/i),
    ).toBeInTheDocument();
  });

  it('renders pool orders', async () => {
    await setup([mockPoolOrder, mockPoolOrder2]);
    expect(screen.getByText('Carlos Pereira')).toBeInTheDocument();
    expect(screen.getByText('Juliana Martins')).toBeInTheDocument();
  });

  it('renders order numbers with hash prefix', async () => {
    await setup([mockPoolOrder]);
    expect(screen.getByText(/#001/)).toBeInTheDocument();
  });

  it('shows confirmed status badge', async () => {
    await setup([mockPoolOrder]);
    expect(screen.getAllByText('Confirmado').length).toBeGreaterThan(0);
  });

  it('formats total amount as BRL currency', async () => {
    await setup([mockPoolOrder]);
    expect(screen.getByText(/R\$\s*120/)).toBeInTheDocument();
  });

  it('renders Assumir button for each order', async () => {
    await setup([mockPoolOrder, mockPoolOrder2]);
    const buttons = screen.getAllByRole('button', { name: /assumir/i });
    expect(buttons).toHaveLength(2);
  });

  it('calls claim mutation when Assumir is clicked', async () => {
    const { useClaimSaleOrder } = await vi.importMock<{
      useClaimSaleOrder: ReturnType<typeof vi.fn>;
    }>('@/services/sale-orders');

    const mockMutate = vi.fn().mockResolvedValue(undefined);
    useClaimSaleOrder.mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
    });

    const { useSaleOrderPool } = await vi.importMock<{
      useSaleOrderPool: ReturnType<typeof vi.fn>;
    }>('@/services/sale-orders');
    useSaleOrderPool.mockReturnValue({
      data: [mockPoolOrder],
      isLoading: false,
    });

    const { default: OrderPoolPage } = await import('../page');
    render(<OrderPoolPage />);

    const button = screen.getByRole('button', {
      name: /assumir ordem #001/i,
    });
    await userEvent.click(button);

    expect(mockMutate).toHaveBeenCalledWith('order-1');
  });

  it('disables Assumir button while claiming', async () => {
    await setup([mockPoolOrder], true);
    const button = screen.getByRole('button', { name: /assumir/i });
    expect(button).toBeDisabled();
  });

  it('shows loading text when isLoading is true', async () => {
    const { useSaleOrderPool, useClaimSaleOrder } = await vi.importMock<{
      useSaleOrderPool: ReturnType<typeof vi.fn>;
      useClaimSaleOrder: ReturnType<typeof vi.fn>;
    }>('@/services/sale-orders');

    useSaleOrderPool.mockReturnValue({ data: [], isLoading: true });
    useClaimSaleOrder.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { default: OrderPoolPage } = await import('../page');
    render(<OrderPoolPage />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });
});

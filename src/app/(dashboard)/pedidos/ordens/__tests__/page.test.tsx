import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ManagedSaleOrder } from '@/types/sale-order';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/pedidos/ordens'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/sale-orders', () => ({
  useSaleOrders: vi.fn(),
}));

vi.mock('@/services/users', () => ({
  useUsers: vi.fn(),
}));

vi.mock('@/providers/permissions-provider', () => ({
  usePermissions: vi.fn(() => ({
    permissions: ['settings:admin'],
    hasPermission: (p: string) => p === 'settings:admin',
  })),
}));

vi.mock('@/providers/user-provider', () => ({
  useUser: vi.fn(() => ({
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@maco.app',
  })),
}));

const mockOrderConfirmed: ManagedSaleOrder = {
  id: 'order-1',
  order_number: '001',
  customer_name: 'Maria Silva',
  state: 'confirmed',
  total_amount: 150.0,
  staff_name: 'João Costa',
  items: [],
  prepayment_required: false,
  created_at: '2024-01-15T00:00:00Z',
};

const mockOrderCompleted: ManagedSaleOrder = {
  id: 'order-2',
  order_number: '002',
  customer_name: 'Ana Souza',
  state: 'completed',
  total_amount: 200.0,
  items: [],
  prepayment_required: false,
  created_at: '2024-01-16T00:00:00Z',
};

async function setup(orders: ManagedSaleOrder[]) {
  const { useSaleOrders } = await vi.importMock<{
    useSaleOrders: ReturnType<typeof vi.fn>;
  }>('@/services/sale-orders');

  const { useUsers } = await vi.importMock<{
    useUsers: ReturnType<typeof vi.fn>;
  }>('@/services/users');

  useSaleOrders.mockReturnValue({
    data: orders,
    meta: { total: orders.length, page: 1, page_size: 10 },
    isLoading: false,
  });

  useUsers.mockReturnValue({ data: [], isLoading: false });

  const { default: OrdersPage } = await import('../page');
  return render(<OrdersPage />);
}

describe('OrdersPage', () => {
  it('renders customer names in the table', async () => {
    await setup([mockOrderConfirmed, mockOrderCompleted]);
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
  });

  it('renders order numbers', async () => {
    await setup([mockOrderConfirmed]);
    expect(screen.getByText('001')).toBeInTheDocument();
  });

  it('shows status badge for confirmed order', async () => {
    await setup([mockOrderConfirmed]);
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('shows status badge for completed order', async () => {
    await setup([mockOrderCompleted]);
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('shows staff name when present', async () => {
    await setup([mockOrderConfirmed]);
    expect(screen.getByText('João Costa')).toBeInTheDocument();
  });

  it('shows dash when staff is absent', async () => {
    await setup([mockOrderCompleted]);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats total amount as BRL currency', async () => {
    await setup([mockOrderConfirmed]);
    expect(screen.getByText(/R\$\s*150/)).toBeInTheDocument();
  });

  it('renders create order button', async () => {
    await setup([]);
    expect(
      screen.getByRole('link', { name: /nova ordem/i }),
    ).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhum resultado encontrado/i),
    ).toBeInTheDocument();
  });

  it('renders status filter select', async () => {
    await setup([mockOrderConfirmed]);
    expect(
      screen.getByRole('combobox', { name: /filtrar por status/i }),
    ).toBeInTheDocument();
  });

  it('renders date range inputs', async () => {
    await setup([mockOrderConfirmed]);
    expect(screen.getByLabelText('Data início')).toBeInTheDocument();
    expect(screen.getByLabelText('Data fim')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    await setup([mockOrderConfirmed]);
    expect(
      screen.getByPlaceholderText(/buscar por cliente/i),
    ).toBeInTheDocument();
  });

  it('renders view detail action for each row', async () => {
    await setup([mockOrderConfirmed]);
    expect(
      screen.getByRole('link', { name: /ver detalhes/i }),
    ).toBeInTheDocument();
  });

  it('shows loading text when isLoading is true', async () => {
    const { useSaleOrders } = await vi.importMock<{
      useSaleOrders: ReturnType<typeof vi.fn>;
    }>('@/services/sale-orders');
    const { useUsers } = await vi.importMock<{
      useUsers: ReturnType<typeof vi.fn>;
    }>('@/services/users');

    useSaleOrders.mockReturnValue({ data: [], isLoading: true });
    useUsers.mockReturnValue({ data: [], isLoading: false });

    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('does not show non-matching customer name', async () => {
    await setup([mockOrderConfirmed]);
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
  });

  it('typing in search updates input value', async () => {
    await setup([mockOrderConfirmed]);
    const searchInput = screen.getByPlaceholderText(/buscar por cliente/i);
    await userEvent.type(searchInput, 'test');
    expect(searchInput).toHaveValue('test');
  });

  it('passes staff_id to useSaleOrders when user is not admin', async () => {
    const { usePermissions } = await vi.importMock<{
      usePermissions: ReturnType<typeof vi.fn>;
    }>('@/providers/permissions-provider');
    const { useUser } = await vi.importMock<{
      useUser: ReturnType<typeof vi.fn>;
    }>('@/providers/user-provider');
    const { useSaleOrders } = await vi.importMock<{
      useSaleOrders: ReturnType<typeof vi.fn>;
    }>('@/services/sale-orders');
    const { useUsers } = await vi.importMock<{
      useUsers: ReturnType<typeof vi.fn>;
    }>('@/services/users');

    usePermissions.mockReturnValue({
      permissions: ['orders:read'],
      hasPermission: () => false,
    });
    useUser.mockReturnValue({
      id: 'staff-42',
      name: 'Staff',
      email: 'staff@maco.app',
    });
    useSaleOrders.mockReturnValue({ data: [], isLoading: false });
    useUsers.mockReturnValue({ data: [], isLoading: false });

    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);

    expect(useSaleOrders).toHaveBeenCalledWith(
      expect.objectContaining({ staff_id: 'staff-42' }),
    );
  });
});

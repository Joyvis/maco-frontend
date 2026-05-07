import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CatalogItem, ManagedSaleOrder } from '@/types/sale-order';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/pedidos/ordens/new'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/sale-orders', () => ({
  useCreateSaleOrder: vi.fn(),
  useAddOrderItem: vi.fn(),
  useAllCatalogItems: vi.fn(),
}));

const mockOrder: ManagedSaleOrder = {
  id: 'order-1',
  order_number: '001',
  customer_name: 'Pedro Alves',
  state: 'confirmed',
  total_amount: 0,
  items: [],
  prepayment_required: false,
  created_at: '2024-01-01T00:00:00Z',
};

const mockCatalogItems: CatalogItem[] = [
  { id: 'svc-1', name: 'Corte de Cabelo', type: 'service', price: 50 },
  { id: 'prod-1', name: 'Shampoo Premium', type: 'product', price: 30 },
];

async function setup(overrides?: {
  createMutate?: ReturnType<typeof vi.fn>;
  addMutate?: ReturnType<typeof vi.fn>;
}) {
  const { useCreateSaleOrder, useAddOrderItem, useAllCatalogItems } =
    await vi.importMock<{
      useCreateSaleOrder: ReturnType<typeof vi.fn>;
      useAddOrderItem: ReturnType<typeof vi.fn>;
      useAllCatalogItems: ReturnType<typeof vi.fn>;
    }>('@/services/sale-orders');

  const createMutate =
    overrides?.createMutate ?? vi.fn().mockResolvedValue({ data: mockOrder });

  const addMutate =
    overrides?.addMutate ??
    vi.fn().mockResolvedValue({
      data: {
        ...mockOrder,
        items: [
          {
            id: 'item-1',
            name: 'Corte de Cabelo',
            type: 'service',
            price: 50,
            quantity: 1,
          },
        ],
      },
    });

  useCreateSaleOrder.mockReturnValue({
    mutateAsync: createMutate,
    isPending: false,
  });
  useAddOrderItem.mockReturnValue({
    mutateAsync: addMutate,
    isPending: false,
  });
  useAllCatalogItems.mockReturnValue({
    data: mockCatalogItems,
    isLoading: false,
  });

  const { default: NewOrderPage } = await import('../page');
  return { rendered: render(<NewOrderPage />), createMutate, addMutate };
}

describe('NewOrderPage — Step 1 (Customer)', () => {
  it('renders page title', async () => {
    await setup();
    expect(screen.getByText('Nova Ordem de Venda')).toBeInTheDocument();
  });

  it('renders step 1 heading', async () => {
    await setup();
    expect(screen.getByText(/passo 1/i)).toBeInTheDocument();
  });

  it('renders customer name input', async () => {
    await setup();
    expect(screen.getByLabelText(/nome do cliente/i)).toBeInTheDocument();
  });

  it('Next button is disabled when customer name is empty', async () => {
    await setup();
    expect(screen.getByRole('button', { name: /próximo/i })).toBeDisabled();
  });

  it('Next button enables when customer name is typed', async () => {
    await setup();
    const input = screen.getByLabelText(/nome do cliente/i);
    await userEvent.type(input, 'Pedro');
    expect(screen.getByRole('button', { name: /próximo/i })).toBeEnabled();
  });

  it('calls createOrder and advances to step 2 on Next click', async () => {
    const { createMutate } = await setup();
    const input = screen.getByLabelText(/nome do cliente/i);
    await userEvent.type(input, 'Pedro Alves');
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith({
        customer_name: 'Pedro Alves',
      }),
    );
    expect(screen.getByText(/passo 2/i)).toBeInTheDocument();
  });
});

describe('NewOrderPage — Step 2 (Items)', () => {
  async function goToStep2() {
    const result = await setup();
    const input = screen.getByLabelText(/nome do cliente/i);
    await userEvent.type(input, 'Pedro Alves');
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    await waitFor(() =>
      expect(screen.getByText(/passo 2/i)).toBeInTheDocument(),
    );
    return result;
  }

  it('renders item search input', async () => {
    await goToStep2();
    expect(screen.getByLabelText(/buscar itens/i)).toBeInTheDocument();
  });

  it('renders catalog items', async () => {
    await goToStep2();
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.getByText('Shampoo Premium')).toBeInTheDocument();
  });

  it('shows service and product type badges', async () => {
    await goToStep2();
    expect(screen.getByText('Serviço')).toBeInTheDocument();
    expect(screen.getByText('Produto')).toBeInTheDocument();
  });

  it('Next button is disabled when no items added', async () => {
    await goToStep2();
    expect(screen.getByRole('button', { name: /próximo/i })).toBeDisabled();
  });

  it('adding an item enables Next button', async () => {
    await goToStep2();
    const addButton = screen.getByRole('button', {
      name: /adicionar corte de cabelo/i,
    });
    await userEvent.click(addButton);
    expect(screen.getByRole('button', { name: /próximo/i })).toBeEnabled();
  });

  it('added item appears in the list below', async () => {
    await goToStep2();
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar corte de cabelo/i }),
    );
    expect(
      screen.getByRole('button', { name: /remover corte de cabelo/i }),
    ).toBeInTheDocument();
  });

  it('removing an item removes it from the list', async () => {
    await goToStep2();
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar corte de cabelo/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /remover corte de cabelo/i }),
    );
    expect(
      screen.queryByRole('button', { name: /remover corte de cabelo/i }),
    ).not.toBeInTheDocument();
  });

  it('shows back button to return to step 1', async () => {
    await goToStep2();
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });

  it('filters catalog by search text', async () => {
    await goToStep2();
    const searchInput = screen.getByLabelText(/buscar itens/i);
    await userEvent.type(searchInput, 'corte');
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.queryByText('Shampoo Premium')).not.toBeInTheDocument();
  });

  it('advances to step 3 after adding item and clicking Next', async () => {
    const { addMutate } = await goToStep2();
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar corte de cabelo/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));

    await waitFor(() => expect(addMutate).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText(/passo 3/i)).toBeInTheDocument(),
    );
  });
});

describe('NewOrderPage — Step 3 (Review)', () => {
  async function goToStep3() {
    const result = await setup();
    const input = screen.getByLabelText(/nome do cliente/i);
    await userEvent.type(input, 'Pedro Alves');
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    await waitFor(() =>
      expect(screen.getByText(/passo 2/i)).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByRole('button', { name: /adicionar corte de cabelo/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    await waitFor(() =>
      expect(screen.getByText(/passo 3/i)).toBeInTheDocument(),
    );
    return result;
  }

  it('shows review step heading', async () => {
    await goToStep3();
    expect(screen.getByText(/passo 3/i)).toBeInTheDocument();
  });

  it('shows customer name in review', async () => {
    await goToStep3();
    expect(screen.getByText('Pedro Alves')).toBeInTheDocument();
  });

  it('shows Concluir button', async () => {
    await goToStep3();
    expect(
      screen.getByRole('button', { name: /concluir/i }),
    ).toBeInTheDocument();
  });

  it('shows confirmed status badge in review', async () => {
    await goToStep3();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });
});

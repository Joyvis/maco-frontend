import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Combo } from '@/types/combo';
import type { Service } from '@/types/service';
import type { Product } from '@/types/product';

vi.mock('@/services/services', () => ({
  useServices: vi.fn(),
}));

vi.mock('@/services/products', () => ({
  useProducts: vi.fn(),
}));

const mockService: Service = {
  id: 'svc-1',
  name: 'Hidratação',
  duration_minutes: 60,
  base_price: 80,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
};

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Shampoo Premium',
  unit: 'ml',
  base_price: 29.9,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
};

const mockCombo: Combo = {
  id: 'combo-1',
  name: 'Combo Relaxamento',
  description: 'Descrição do combo',
  discount_percentage: 10,
  status: 'active',
  item_count: 1,
  items: [
    {
      id: 'ci-1',
      item_type: 'service',
      item_id: 'svc-1',
      name: 'Hidratação',
      base_price: 80,
    },
  ],
  created_at: '2024-01-01T00:00:00Z',
};

async function setupForm(combo?: Combo, isLoading = false) {
  const { useServices } = await vi.importMock<{
    useServices: ReturnType<typeof vi.fn>;
  }>('@/services/services');
  const { useProducts } = await vi.importMock<{
    useProducts: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  useServices.mockReturnValue({ data: [mockService], isLoading: false });
  useProducts.mockReturnValue({ data: [mockProduct], isLoading: false });

  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const { ComboForm } = await import('../combo-form');
  return {
    onSubmit,
    result: render(
      <ComboForm combo={combo} onSubmit={onSubmit} isLoading={isLoading} />,
    ),
  };
}

describe('ComboForm', () => {
  it('renders empty form in create mode', async () => {
    await setupForm();
    expect(screen.getByLabelText(/nome/i)).toHaveValue('');
    expect(screen.getByLabelText(/desconto/i)).toHaveValue(null);
  });

  it('pre-fills form with combo data in edit mode', async () => {
    await setupForm(mockCombo);
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Combo Relaxamento');
    expect(screen.getByLabelText(/desconto/i)).toHaveValue(10);
    expect(screen.getByLabelText(/descrição/i)).toHaveValue(
      'Descrição do combo',
    );
  });

  it('shows service in item picker', async () => {
    await setupForm();
    expect(screen.getByText('Hidratação')).toBeInTheDocument();
  });

  it('shows product in item picker', async () => {
    await setupForm();
    expect(screen.getByText('Shampoo Premium')).toBeInTheDocument();
  });

  it('shows type badge for service items', async () => {
    await setupForm();
    const badges = screen.getAllByText('Serviço');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('shows type badge for product items', async () => {
    await setupForm();
    expect(screen.getByText('Produto')).toBeInTheDocument();
  });

  it('adds service item when clicking add button', async () => {
    await setupForm();
    const addButton = screen.getByRole('button', {
      name: /adicionar hidratação/i,
    });
    await userEvent.click(addButton);
    const selectedList = screen.getByRole('list', {
      name: /itens selecionados/i,
    });
    expect(selectedList).toBeInTheDocument();
  });

  it('removes item when clicking remove button', async () => {
    await setupForm(mockCombo);
    const removeButton = screen.getByRole('button', {
      name: /remover hidratação/i,
    });
    await userEvent.click(removeButton);
    expect(
      screen.queryByRole('list', { name: /itens selecionados/i }),
    ).not.toBeInTheDocument();
  });

  it('filters items based on search query', async () => {
    await setupForm();
    const searchInput = screen.getByRole('textbox', { name: /buscar item/i });
    await userEvent.type(searchInput, 'Hidra');
    expect(screen.getByText('Hidratação')).toBeInTheDocument();
    expect(screen.queryByText('Shampoo Premium')).not.toBeInTheDocument();
  });

  it('shows empty message when search has no results', async () => {
    await setupForm();
    const searchInput = screen.getByRole('textbox', { name: /buscar item/i });
    await userEvent.type(searchInput, 'zzz');
    expect(screen.getByText(/nenhum item encontrado/i)).toBeInTheDocument();
  });

  it('disables add button for already selected items', async () => {
    await setupForm(mockCombo);
    const addButton = screen.getByRole('button', {
      name: /adicionar hidratação/i,
    });
    expect(addButton).toBeDisabled();
  });

  it('shows spinner when loading', async () => {
    await setupForm(undefined, true);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('calls onSubmit with correct data on valid submission', async () => {
    const { onSubmit } = await setupForm();

    await userEvent.clear(screen.getByLabelText(/nome/i));
    await userEvent.type(screen.getByLabelText(/nome/i), 'Novo Combo');
    await userEvent.clear(screen.getByLabelText(/desconto/i));
    await userEvent.type(screen.getByLabelText(/desconto/i), '15');

    // Add a service item
    await userEvent.click(
      screen.getByRole('button', { name: /adicionar hidratação/i }),
    );

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Combo',
          discount_percentage: 15,
          items: expect.arrayContaining([
            expect.objectContaining({ item_type: 'service', item_id: 'svc-1' }),
          ]),
        }),
      );
    });
  });

  it('passes undefined for empty description', async () => {
    const { onSubmit } = await setupForm(mockCombo);

    await userEvent.clear(screen.getByLabelText(/descrição/i));
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: undefined }),
      );
    });
  });

  it('renders with undefined services and products (null data)', async () => {
    const { useServices } = await vi.importMock<{
      useServices: ReturnType<typeof vi.fn>;
    }>('@/services/services');
    const { useProducts } = await vi.importMock<{
      useProducts: ReturnType<typeof vi.fn>;
    }>('@/services/products');

    useServices.mockReturnValue({ data: undefined, isLoading: false });
    useProducts.mockReturnValue({ data: undefined, isLoading: false });

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { ComboForm } = await import('../combo-form');
    render(<ComboForm onSubmit={onSubmit} isLoading={false} />);

    // Picker list should be empty
    expect(
      screen.getByRole('list', { name: /itens disponíveis/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error for missing name on submit', async () => {
    await setupForm();

    // Don't fill in the name, just click save
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
    });
  });
});

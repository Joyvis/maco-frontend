import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Product } from '@/types/product';

vi.mock('@/services/products', () => ({
  useCategories: vi.fn(),
}));

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Shampoo Premium',
  description: 'Descrição do produto',
  category: 'cat-1',
  unit: 'ml',
  base_price: 29.9,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

async function setupForm(
  product?: Product,
  isLoading = false,
  categories = [{ id: 'cat-1', name: 'Cabelo' }],
) {
  const { useCategories } = await vi.importMock<{
    useCategories: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  useCategories.mockReturnValue({ data: categories, isLoading: false });

  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const { ProductForm } = await import('../product-form');
  return {
    onSubmit,
    result: render(
      <ProductForm
        product={product}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />,
    ),
  };
}

describe('ProductForm', () => {
  it('renders empty form in create mode', async () => {
    await setupForm();
    expect(screen.getByLabelText(/nome/i)).toHaveValue('');
    expect(screen.getByLabelText(/preço/i)).toHaveValue(null);
  });

  it('pre-fills form with product data in edit mode', async () => {
    await setupForm(mockProduct);
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Shampoo Premium');
    expect(screen.getByLabelText(/preço/i)).toHaveValue(29.9);
    expect(screen.getByLabelText(/descrição/i)).toHaveValue(
      'Descrição do produto',
    );
  });

  it('shows spinner when loading', async () => {
    await setupForm(undefined, true);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disables submit button when loading', async () => {
    await setupForm(undefined, true);
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
  });

  it('renders unit selector with default unit value', async () => {
    await setupForm();
    // Radix Select renders a native select for accessibility — verify options
    const nativeSelects = document.querySelectorAll('select');
    const unitSelect = Array.from(nativeSelects).find((s) =>
      Array.from(s.options).some((o) => o.value === 'unit'),
    );
    expect(unitSelect).toBeDefined();
    const optionValues = Array.from(unitSelect!.options).map((o) => o.value);
    expect(optionValues).toContain('ml');
    expect(optionValues).toContain('g');
    expect(optionValues).toContain('unit');
    expect(optionValues).toContain('kg');
    expect(optionValues).toContain('l');
  });

  it('calls onSubmit with correct data on valid submission', async () => {
    const { onSubmit } = await setupForm();

    await userEvent.clear(screen.getByLabelText(/nome/i));
    await userEvent.type(screen.getByLabelText(/nome/i), 'Novo Produto');
    await userEvent.clear(screen.getByLabelText(/preço/i));
    await userEvent.type(screen.getByLabelText(/preço/i), '49.9');

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Produto',
          base_price: 49.9,
        }),
      );
    });
  });

  it('passes undefined for empty description', async () => {
    const { onSubmit } = await setupForm(mockProduct);

    await userEvent.clear(screen.getByLabelText(/descrição/i));
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: undefined }),
      );
    });
  });

  it('passes undefined for empty category', async () => {
    const { onSubmit } = await setupForm({
      ...mockProduct,
      category: undefined,
    });

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ category: undefined }),
      );
    });
  });
});

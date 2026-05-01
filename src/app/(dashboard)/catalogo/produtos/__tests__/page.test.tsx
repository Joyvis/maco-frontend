import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Product } from '@/types/product';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/produtos'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/products', () => ({
  useProducts: vi.fn(),
  useActivateProduct: vi.fn(),
  useArchiveProduct: vi.fn(),
}));

const mockDraftProduct: Product = {
  id: 'prod-1',
  name: 'Shampoo Premium',
  category: 'Cabelo',
  unit: 'ml',
  base_price: 29.9,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

const mockActiveProduct: Product = {
  id: 'prod-2',
  name: 'Condicionador Plus',
  unit: 'ml',
  base_price: 35.0,
  status: 'active',
  created_at: '2024-02-01T00:00:00Z',
};

const mockArchivedProduct: Product = {
  id: 'prod-3',
  name: 'Gel Antigo',
  unit: 'g',
  base_price: 10.0,
  status: 'archived',
  created_at: '2024-03-01T00:00:00Z',
};

async function setup(products: Product[]) {
  const { useProducts, useActivateProduct, useArchiveProduct } =
    await vi.importMock<{
      useProducts: ReturnType<typeof vi.fn>;
      useActivateProduct: ReturnType<typeof vi.fn>;
      useArchiveProduct: ReturnType<typeof vi.fn>;
    }>('@/services/products');

  useProducts.mockReturnValue({
    data: products,
    meta: { total: products.length, page: 1, page_size: 10 },
    isLoading: false,
  });
  useActivateProduct.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useArchiveProduct.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });

  const { default: ProductsPage } = await import('../page');
  return render(<ProductsPage />);
}

describe('ProductsPage', () => {
  it('renders product names in the table', async () => {
    await setup([mockDraftProduct, mockActiveProduct]);
    expect(screen.getByText('Shampoo Premium')).toBeInTheDocument();
    expect(screen.getByText('Condicionador Plus')).toBeInTheDocument();
  });

  it('shows Rascunho badge for draft products', async () => {
    await setup([mockDraftProduct]);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows Ativo badge for active products', async () => {
    await setup([mockActiveProduct]);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('shows Arquivado badge for archived products', async () => {
    await setup([mockArchivedProduct]);
    expect(screen.getByText('Arquivado')).toBeInTheDocument();
  });

  it('displays unit label for products', async () => {
    await setup([mockDraftProduct]);
    expect(screen.getByText('ml')).toBeInTheDocument();
  });

  it('renders create product button', async () => {
    await setup([]);
    expect(
      screen.getByRole('link', { name: /novo produto/i }),
    ).toBeInTheDocument();
  });

  it('shows edit action in row actions', async () => {
    await setup([mockDraftProduct]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/editar/i)).toBeInTheDocument();
  });

  it('shows activate action for non-active products', async () => {
    await setup([mockDraftProduct]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/ativar/i)).toBeInTheDocument();
  });

  it('hides activate action for active products', async () => {
    await setup([mockActiveProduct]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.queryByText(/ativar/i)).not.toBeInTheDocument();
  });

  it('shows archive action for non-archived products', async () => {
    await setup([mockActiveProduct]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/arquivar/i)).toBeInTheDocument();
  });

  it('hides archive action for archived products', async () => {
    await setup([mockArchivedProduct]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.queryByText(/arquivar/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no products exist', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhum resultado encontrado/i),
    ).toBeInTheDocument();
  });

  it('shows category when present', async () => {
    await setup([mockDraftProduct]);
    expect(screen.getByText('Cabelo')).toBeInTheDocument();
  });
});

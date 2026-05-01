import { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';

import type { Product } from '@/types/product';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/produtos/prod-1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/products', () => ({
  useProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
  useActivateProduct: vi.fn(),
  useArchiveProduct: vi.fn(),
  useCategories: vi.fn(),
}));

const mockDraftProduct: Product = {
  id: 'prod-1',
  name: 'Shampoo Premium',
  description: 'Um bom shampoo',
  category: 'cat-1',
  unit: 'ml',
  base_price: 29.9,
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
};

const mockActiveProduct: Product = {
  ...mockDraftProduct,
  id: 'prod-2',
  name: 'Condicionador Plus',
  status: 'active',
};

const mockArchivedProduct: Product = {
  ...mockDraftProduct,
  id: 'prod-3',
  name: 'Gel Antigo',
  status: 'archived',
};

async function setup(product: Product | null, isLoading = false) {
  const {
    useProduct,
    useUpdateProduct,
    useActivateProduct,
    useArchiveProduct,
    useCategories,
  } = await vi.importMock<{
    useProduct: ReturnType<typeof vi.fn>;
    useUpdateProduct: ReturnType<typeof vi.fn>;
    useActivateProduct: ReturnType<typeof vi.fn>;
    useArchiveProduct: ReturnType<typeof vi.fn>;
    useCategories: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  useProduct.mockReturnValue({ data: product ?? undefined, isLoading });
  useUpdateProduct.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useActivateProduct.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useArchiveProduct.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useCategories.mockReturnValue({ data: [], isLoading: false });

  const { default: EditProductPage } = await import('../page');
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Suspense fallback={null}>
        <EditProductPage
          params={Promise.resolve({ id: product?.id ?? 'prod-1' })}
        />
      </Suspense>,
    );
  });
  return result;
}

describe('EditProductPage', () => {
  it('shows loading state', async () => {
    await setup(null, true);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('shows not found state when product is null', async () => {
    await setup(null, false);
    expect(screen.getByText(/não encontrado/i)).toBeInTheDocument();
  });

  it('renders product name in the header', async () => {
    await setup(mockDraftProduct);
    expect(
      screen.getByText(/editar produto: shampoo premium/i),
    ).toBeInTheDocument();
  });

  it('renders form with pre-filled product name', async () => {
    await setup(mockDraftProduct);
    const nameInput = screen.getByDisplayValue('Shampoo Premium');
    expect(nameInput).toBeInTheDocument();
  });

  it('shows status badge', async () => {
    await setup(mockDraftProduct);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('shows Ativar button for draft products', async () => {
    await setup(mockDraftProduct);
    expect(screen.getByRole('button', { name: /ativar/i })).toBeInTheDocument();
  });

  it('shows Arquivar button for draft products', async () => {
    await setup(mockDraftProduct);
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('hides Ativar button for active products', async () => {
    await setup(mockActiveProduct);
    expect(
      screen.queryByRole('button', { name: /ativar/i }),
    ).not.toBeInTheDocument();
  });

  it('shows Arquivar button for active products', async () => {
    await setup(mockActiveProduct);
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('shows Ativar button for archived products (re-activate)', async () => {
    await setup(mockArchivedProduct);
    expect(screen.getByRole('button', { name: /ativar/i })).toBeInTheDocument();
  });

  it('hides Arquivar button for archived products', async () => {
    await setup(mockArchivedProduct);
    expect(
      screen.queryByRole('button', { name: /arquivar/i }),
    ).not.toBeInTheDocument();
  });

  it('shows active status badge for active products', async () => {
    await setup(mockActiveProduct);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });
});

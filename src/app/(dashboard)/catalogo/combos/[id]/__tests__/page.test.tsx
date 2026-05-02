import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Combo } from '@/types/combo';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useParams: vi.fn(() => ({ id: 'combo-1' })),
  usePathname: vi.fn().mockReturnValue('/catalogo/combos/combo-1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/combos', () => ({
  useCombo: vi.fn(),
  useUpdateCombo: vi.fn(),
  useArchiveCombo: vi.fn(),
}));

vi.mock('@/services/services', () => ({
  useServices: vi.fn(),
}));

vi.mock('@/services/products', () => ({
  useProducts: vi.fn(),
}));

const mockCombo: Combo = {
  id: 'combo-1',
  name: 'Combo Relaxamento',
  description: 'Descrição',
  discount_percentage: 10,
  status: 'active',
  item_count: 0,
  items: [],
  created_at: '2024-01-01T00:00:00Z',
};

async function setup(combo?: Combo | null, isLoading = false) {
  const { useCombo, useUpdateCombo, useArchiveCombo } = await vi.importMock<{
    useCombo: ReturnType<typeof vi.fn>;
    useUpdateCombo: ReturnType<typeof vi.fn>;
    useArchiveCombo: ReturnType<typeof vi.fn>;
  }>('@/services/combos');

  const { useServices } = await vi.importMock<{
    useServices: ReturnType<typeof vi.fn>;
  }>('@/services/services');

  const { useProducts } = await vi.importMock<{
    useProducts: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  const updateMutateAsync = vi.fn().mockResolvedValue(undefined);
  const archiveMutateAsync = vi.fn().mockResolvedValue(undefined);

  useCombo.mockReturnValue({
    data: combo === undefined ? mockCombo : combo,
    isLoading,
  });
  useUpdateCombo.mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  });
  useArchiveCombo.mockReturnValue({
    mutateAsync: archiveMutateAsync,
    isPending: false,
  });
  useServices.mockReturnValue({ data: [], isLoading: false });
  useProducts.mockReturnValue({ data: [], isLoading: false });

  const { default: EditComboPage } = await import('../page');
  return {
    updateMutateAsync,
    archiveMutateAsync,
    result: render(<EditComboPage />),
  };
}

describe('EditComboPage', () => {
  it('shows loading state', async () => {
    await setup(undefined, true);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('handles non-string id from useParams', async () => {
    const { useParams } = await vi.importMock<{
      useParams: ReturnType<typeof vi.fn>;
    }>('next/navigation');
    useParams.mockReturnValue({ id: ['combo-1', 'combo-2'] });

    const { useCombo, useUpdateCombo, useArchiveCombo } = await vi.importMock<{
      useCombo: ReturnType<typeof vi.fn>;
      useUpdateCombo: ReturnType<typeof vi.fn>;
      useArchiveCombo: ReturnType<typeof vi.fn>;
    }>('@/services/combos');
    useCombo.mockReturnValue({ data: undefined, isLoading: false });
    useUpdateCombo.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useArchiveCombo.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

    const { useServices } = await vi.importMock<{
      useServices: ReturnType<typeof vi.fn>;
    }>('@/services/services');
    const { useProducts } = await vi.importMock<{
      useProducts: ReturnType<typeof vi.fn>;
    }>('@/services/products');
    useServices.mockReturnValue({ data: [], isLoading: false });
    useProducts.mockReturnValue({ data: [], isLoading: false });

    const { default: EditComboPage } = await import('../page');
    render(<EditComboPage />);
    expect(screen.getByText(/não encontrado/i)).toBeInTheDocument();
  });

  it('shows not found when combo is null', async () => {
    await setup(null);
    expect(screen.getByText(/não encontrado/i)).toBeInTheDocument();
  });

  it('pre-fills form with combo data', async () => {
    await setup();
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Combo Relaxamento');
    expect(screen.getByLabelText(/desconto/i)).toHaveValue(10);
  });

  it('shows archive button for active combo', async () => {
    await setup();
    expect(
      screen.getByRole('button', { name: /arquivar/i }),
    ).toBeInTheDocument();
  });

  it('hides archive button for archived combo', async () => {
    await setup({ ...mockCombo, status: 'archived' });
    expect(
      screen.queryByRole('button', { name: /arquivar/i }),
    ).not.toBeInTheDocument();
  });

  it('calls updateCombo on form submit', async () => {
    const { updateMutateAsync } = await setup();

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalled();
    });
  });

  it('shows archive confirmation dialog when clicking archive button', async () => {
    await setup();

    await userEvent.click(screen.getByRole('button', { name: /arquivar/i }));
    // Dialog title should appear
    await waitFor(() => {
      expect(screen.getByText(/arquivar combo/i)).toBeInTheDocument();
    });
  });
});

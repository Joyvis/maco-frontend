import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/combos/new'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/combos', () => ({
  useCreateCombo: vi.fn(),
}));

vi.mock('@/services/services', () => ({
  useServices: vi.fn(),
}));

vi.mock('@/services/products', () => ({
  useProducts: vi.fn(),
}));

async function setup() {
  const { useCreateCombo } = await vi.importMock<{
    useCreateCombo: ReturnType<typeof vi.fn>;
  }>('@/services/combos');

  const { useServices } = await vi.importMock<{
    useServices: ReturnType<typeof vi.fn>;
  }>('@/services/services');

  const { useProducts } = await vi.importMock<{
    useProducts: ReturnType<typeof vi.fn>;
  }>('@/services/products');

  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  useCreateCombo.mockReturnValue({ mutateAsync, isPending: false });
  useServices.mockReturnValue({ data: [], isLoading: false });
  useProducts.mockReturnValue({ data: [], isLoading: false });

  const { default: NewComboPage } = await import('../page');
  return { mutateAsync, result: render(<NewComboPage />) };
}

describe('NewComboPage', () => {
  it('renders the form', async () => {
    await setup();
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/desconto/i)).toBeInTheDocument();
  });

  it('shows the page header', async () => {
    await setup();
    expect(screen.getByText(/novo combo/i)).toBeInTheDocument();
  });

  it('calls createCombo and navigates on valid submit', async () => {
    const { mutateAsync } = await setup();
    const { useRouter } = await vi.importMock<{
      useRouter: ReturnType<typeof vi.fn>;
    }>('next/navigation');
    const push = vi.fn();
    useRouter.mockReturnValue({ push });

    await userEvent.type(screen.getByLabelText(/nome/i), 'Combo Teste');
    await userEvent.type(screen.getByLabelText(/desconto/i), '10');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });
  });
});

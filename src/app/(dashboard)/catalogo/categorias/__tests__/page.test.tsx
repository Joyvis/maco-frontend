import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Category } from '@/types/product';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/categorias'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/categories', () => ({
  useCategories: vi.fn(),
  useCreateCategory: vi.fn(),
  useUpdateCategory: vi.fn(),
  useDeleteCategory: vi.fn(),
  useReorderCategories: vi.fn(),
}));

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Cabelo', display_order: 0 },
  { id: 'cat-2', name: 'Unhas', display_order: 1 },
];

async function setup(categories: Category[] = mockCategories) {
  const {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useReorderCategories,
  } = await vi.importMock<{
    useCategories: ReturnType<typeof vi.fn>;
    useCreateCategory: ReturnType<typeof vi.fn>;
    useUpdateCategory: ReturnType<typeof vi.fn>;
    useDeleteCategory: ReturnType<typeof vi.fn>;
    useReorderCategories: ReturnType<typeof vi.fn>;
  }>('@/services/categories');

  useCategories.mockReturnValue({ data: categories, isLoading: false });
  useCreateCategory.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useUpdateCategory.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useDeleteCategory.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  });
  useReorderCategories.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  });

  const { default: CategoriasPage } = await import('../page');
  return render(<CategoriasPage />);
}

describe('CategoriasPage', () => {
  it('renders category names in the list', async () => {
    await setup();
    expect(screen.getByText('Cabelo')).toBeInTheDocument();
    expect(screen.getByText('Unhas')).toBeInTheDocument();
  });

  it('shows empty state when no categories', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhuma categoria cadastrada/i),
    ).toBeInTheDocument();
  });

  it('shows add category button', async () => {
    await setup();
    expect(
      screen.getByRole('button', { name: /nova categoria/i }),
    ).toBeInTheDocument();
  });

  it('shows inline add form when clicking nova categoria', async () => {
    await setup();
    await userEvent.click(
      screen.getByRole('button', { name: /nova categoria/i }),
    );
    expect(
      screen.getByRole('textbox', { name: /nova categoria/i }),
    ).toBeInTheDocument();
  });

  it('shows rename button for each category', async () => {
    await setup();
    expect(screen.getAllByRole('button', { name: /renomear/i })).toHaveLength(
      2,
    );
  });

  it('shows delete button for each category', async () => {
    await setup();
    expect(screen.getAllByRole('button', { name: /excluir/i })).toHaveLength(2);
  });

  it('shows inline edit input when clicking rename', async () => {
    await setup();
    const renameButtons = screen.getAllByRole('button', { name: /renomear/i });
    await userEvent.click(renameButtons[0]!);
    expect(
      screen.getByRole('textbox', { name: /nome da categoria/i }),
    ).toBeInTheDocument();
  });

  it('cancels edit when pressing Escape', async () => {
    await setup();
    const renameButtons = screen.getAllByRole('button', { name: /renomear/i });
    await userEvent.click(renameButtons[0]!);
    await userEvent.keyboard('{Escape}');
    expect(
      screen.queryByRole('textbox', { name: /nome da categoria/i }),
    ).not.toBeInTheDocument();
  });

  it('creates category when submitting add form', async () => {
    const createMutateAsync = vi.fn().mockResolvedValue(undefined);

    const {
      useCategories,
      useCreateCategory,
      useUpdateCategory,
      useDeleteCategory,
      useReorderCategories,
    } = await vi.importMock<{
      useCategories: ReturnType<typeof vi.fn>;
      useCreateCategory: ReturnType<typeof vi.fn>;
      useUpdateCategory: ReturnType<typeof vi.fn>;
      useDeleteCategory: ReturnType<typeof vi.fn>;
      useReorderCategories: ReturnType<typeof vi.fn>;
    }>('@/services/categories');

    useCategories.mockReturnValue({ data: [], isLoading: false });
    useCreateCategory.mockReturnValue({
      mutateAsync: createMutateAsync,
      isPending: false,
    });
    useUpdateCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    useDeleteCategory.mockReturnValue({ mutateAsync: vi.fn() });
    useReorderCategories.mockReturnValue({ mutateAsync: vi.fn() });

    const { default: CategoriasPage } = await import('../page');
    render(<CategoriasPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /nova categoria/i }),
    );
    const input = screen.getByRole('textbox', { name: /nova categoria/i });
    await userEvent.type(input, 'Maquiagem');
    await userEvent.click(screen.getByRole('button', { name: /adicionar/i }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({ name: 'Maquiagem' });
    });
  });
});

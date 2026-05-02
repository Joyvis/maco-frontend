import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import type { Category } from '@/types/product';

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

  const createMutateAsync = vi.fn().mockResolvedValue(undefined);
  const updateMutateAsync = vi.fn().mockResolvedValue(undefined);
  const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
  const reorderMutateAsync = vi.fn().mockResolvedValue(undefined);

  useCategories.mockReturnValue({ data: categories, isLoading: false });
  useCreateCategory.mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
  });
  useUpdateCategory.mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  });
  useDeleteCategory.mockReturnValue({ mutateAsync: deleteMutateAsync });
  useReorderCategories.mockReturnValue({ mutateAsync: reorderMutateAsync });

  const { CategoryList } = await import('../category-list');
  render(<CategoryList />);

  return {
    createMutateAsync,
    updateMutateAsync,
    deleteMutateAsync,
    reorderMutateAsync,
  };
}

describe('CategoryList', () => {
  it('renders categories in correct order', async () => {
    await setup();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Cabelo');
    expect(items[1]).toHaveTextContent('Unhas');
  });

  it('shows loading state', async () => {
    const { useCategories } = await vi.importMock<{
      useCategories: ReturnType<typeof vi.fn>;
    }>('@/services/categories');
    useCategories.mockReturnValue({ data: [], isLoading: true });

    const { CategoryList } = await import('../category-list');
    render(<CategoryList />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('shows empty state when no categories', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhuma categoria cadastrada/i),
    ).toBeInTheDocument();
  });

  it('starts editing when clicking category name', async () => {
    await setup();
    const nameEl = screen.getByRole('button', { name: /editar cabelo/i });
    await userEvent.click(nameEl);
    expect(
      screen.getByRole('textbox', { name: /nome da categoria/i }),
    ).toBeInTheDocument();
  });

  it('cancels edit on Escape', async () => {
    await setup();
    await userEvent.click(
      screen.getByRole('button', { name: /editar cabelo/i }),
    );
    await userEvent.keyboard('{Escape}');
    expect(
      screen.queryByRole('textbox', { name: /nome da categoria/i }),
    ).not.toBeInTheDocument();
  });

  it('saves edit on Enter', async () => {
    const { updateMutateAsync } = await setup();
    await userEvent.click(
      screen.getAllByRole('button', { name: /renomear/i })[0]!,
    );
    const input = screen.getByRole('textbox', { name: /nome da categoria/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Cabelo Novo');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 'cat-1',
        input: { name: 'Cabelo Novo' },
      });
    });
  });

  it('saves edit on confirm button click', async () => {
    const { updateMutateAsync } = await setup();
    await userEvent.click(
      screen.getAllByRole('button', { name: /renomear/i })[0]!,
    );
    const input = screen.getByRole('textbox', { name: /nome da categoria/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Novo Nome');
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cat-1' }),
      );
    });
  });

  it('cancels edit on cancel button click', async () => {
    await setup();
    await userEvent.click(
      screen.getAllByRole('button', { name: /renomear/i })[0]!,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(
      screen.queryByRole('textbox', { name: /nome da categoria/i }),
    ).not.toBeInTheDocument();
  });

  it('creates category on add form submit', async () => {
    const { createMutateAsync } = await setup();
    await userEvent.click(
      screen.getByRole('button', { name: /nova categoria/i }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: /nova categoria/i }),
      'Maquiagem',
    );
    await userEvent.click(screen.getByRole('button', { name: /adicionar/i }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({ name: 'Maquiagem' });
    });
  });

  it('creates category on Enter in add form', async () => {
    const { createMutateAsync } = await setup();
    await userEvent.click(
      screen.getByRole('button', { name: /nova categoria/i }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: /nova categoria/i }),
      'Manicure{Enter}',
    );

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({ name: 'Manicure' });
    });
  });

  it('cancels add form on Escape', async () => {
    await setup();
    await userEvent.click(
      screen.getByRole('button', { name: /nova categoria/i }),
    );
    await userEvent.keyboard('{Escape}');
    expect(
      screen.queryByRole('textbox', { name: /nova categoria/i }),
    ).not.toBeInTheDocument();
  });

  it('cancels add form on cancel button', async () => {
    await setup();
    await userEvent.click(
      screen.getByRole('button', { name: /nova categoria/i }),
    );
    const cancelButtons = screen.getAllByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelButtons[cancelButtons.length - 1]!);
    expect(
      screen.queryByRole('textbox', { name: /nova categoria/i }),
    ).not.toBeInTheDocument();
  });

  it('calls deleteCategory mutation when confirming delete', async () => {
    const { deleteMutateAsync } = await setup([
      { id: 'cat-1', name: 'Cabelo', display_order: 0 },
    ]);

    // Open the confirmation dialog via the delete trigger button
    const deleteBtn = screen.getByRole('button', { name: /excluir cabelo/i });
    await userEvent.click(deleteBtn);

    // Confirm via the dialog confirm button
    const confirmBtns = screen.getAllByRole('button', { name: /excluir/i });
    // The last one is the confirm button inside the dialog
    await userEvent.click(confirmBtns[confirmBtns.length - 1]!);

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledWith('cat-1');
    });
  });

  it('cancels edit when committed with empty name', async () => {
    await setup();
    await userEvent.click(
      screen.getAllByRole('button', { name: /renomear/i })[0]!,
    );
    const input = screen.getByRole('textbox', { name: /nome da categoria/i });
    await userEvent.clear(input);
    await userEvent.keyboard('{Enter}');
    expect(
      screen.queryByRole('textbox', { name: /nome da categoria/i }),
    ).not.toBeInTheDocument();
  });

  it('does not add category when name is empty', async () => {
    const { createMutateAsync } = await setup();
    await userEvent.click(
      screen.getByRole('button', { name: /nova categoria/i }),
    );
    // Leave the input empty and click Adicionar
    await userEvent.click(screen.getByRole('button', { name: /adicionar/i }));
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it('shows active-items toast when delete fails with active error', async () => {
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

    useCategories.mockReturnValue({
      data: [{ id: 'cat-1', name: 'Cabelo', display_order: 0 }],
      isLoading: false,
    });
    useCreateCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    useUpdateCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    useDeleteCategory.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue({ message: 'has active items' }),
    });
    useReorderCategories.mockReturnValue({ mutateAsync: vi.fn() });

    const { CategoryList } = await import('../category-list');
    render(<CategoryList />);

    const deleteBtn = screen.getByRole('button', { name: /excluir cabelo/i });
    await userEvent.click(deleteBtn);
    const confirmBtns = screen.getAllByRole('button', { name: /excluir/i });
    await userEvent.click(confirmBtns[confirmBtns.length - 1]!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/não é possível excluir/i),
      );
    });
  });

  it('shows generic error toast when delete fails without active in message', async () => {
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

    useCategories.mockReturnValue({
      data: [{ id: 'cat-1', name: 'Cabelo', display_order: 0 }],
      isLoading: false,
    });
    useCreateCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    useUpdateCategory.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    useDeleteCategory.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue('network error'),
    });
    useReorderCategories.mockReturnValue({ mutateAsync: vi.fn() });

    const { CategoryList } = await import('../category-list');
    render(<CategoryList />);

    const deleteBtn = screen.getByRole('button', { name: /excluir cabelo/i });
    await userEvent.click(deleteBtn);
    const confirmBtns = screen.getAllByRole('button', { name: /excluir/i });
    await userEvent.click(confirmBtns[confirmBtns.length - 1]!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/erro ao excluir categoria/i),
      );
    });
  });

  it('starts editing when Enter is pressed on category name span', async () => {
    await setup();
    const nameSpan = screen.getByRole('button', { name: /editar cabelo/i });
    fireEvent.keyDown(nameSpan, { key: 'Enter' });
    expect(
      screen.getByRole('textbox', { name: /nome da categoria/i }),
    ).toBeInTheDocument();
  });
});

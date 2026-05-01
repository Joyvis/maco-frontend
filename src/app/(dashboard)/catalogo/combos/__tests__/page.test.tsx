import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ComboSummary } from '@/types/combo';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn().mockReturnValue('/catalogo/combos'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/combos', () => ({
  useCombos: vi.fn(),
  useArchiveCombo: vi.fn(),
}));

const mockActiveCombo: ComboSummary = {
  id: 'combo-1',
  name: 'Combo Relaxamento',
  discount_percentage: 10,
  status: 'active',
  item_count: 3,
  created_at: '2024-01-01T00:00:00Z',
};

const mockArchivedCombo: ComboSummary = {
  id: 'combo-2',
  name: 'Combo Antigo',
  discount_percentage: 5,
  status: 'archived',
  item_count: 1,
  created_at: '2024-02-01T00:00:00Z',
};

async function setup(combos: ComboSummary[]) {
  const { useCombos, useArchiveCombo } = await vi.importMock<{
    useCombos: ReturnType<typeof vi.fn>;
    useArchiveCombo: ReturnType<typeof vi.fn>;
  }>('@/services/combos');

  useCombos.mockReturnValue({
    data: combos,
    meta: { total: combos.length, page: 1, page_size: 10 },
    isLoading: false,
  });
  useArchiveCombo.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  });

  const { default: CombosPage } = await import('../page');
  return render(<CombosPage />);
}

describe('CombosPage', () => {
  it('renders combo names in the table', async () => {
    await setup([mockActiveCombo]);
    expect(screen.getByText('Combo Relaxamento')).toBeInTheDocument();
  });

  it('shows item count', async () => {
    await setup([mockActiveCombo]);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows discount percentage', async () => {
    await setup([mockActiveCombo]);
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('shows Ativo badge for active combos', async () => {
    await setup([mockActiveCombo]);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('shows Arquivado badge for archived combos', async () => {
    await setup([mockArchivedCombo]);
    expect(screen.getByText('Arquivado')).toBeInTheDocument();
  });

  it('renders create combo button', async () => {
    await setup([]);
    expect(
      screen.getByRole('link', { name: /novo combo/i }),
    ).toBeInTheDocument();
  });

  it('shows edit action in row actions', async () => {
    await setup([mockActiveCombo]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/editar/i)).toBeInTheDocument();
  });

  it('navigates to edit page on edit action click', async () => {
    const push = vi.fn();
    const { useRouter } = await vi.importMock<{
      useRouter: ReturnType<typeof vi.fn>;
    }>('next/navigation');
    useRouter.mockReturnValue({ push, replace: vi.fn() });

    await setup([mockActiveCombo]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    await userEvent.click(screen.getByRole('menuitem', { name: /editar/i }));
    expect(push).toHaveBeenCalledWith('/catalogo/combos/combo-1');
  });

  it('shows archive action for active combos', async () => {
    await setup([mockActiveCombo]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.getByText(/arquivar/i)).toBeInTheDocument();
  });

  it('hides archive action for archived combos', async () => {
    await setup([mockArchivedCombo]);
    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    expect(screen.queryByText(/arquivar/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no combos exist', async () => {
    await setup([]);
    expect(
      screen.getByText(/nenhum resultado encontrado/i),
    ).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    const { useCombos, useArchiveCombo } = await vi.importMock<{
      useCombos: ReturnType<typeof vi.fn>;
      useArchiveCombo: ReturnType<typeof vi.fn>;
    }>('@/services/combos');
    useCombos.mockReturnValue({ data: undefined, isLoading: true });
    useArchiveCombo.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    const { default: CombosPage } = await import('../page');
    render(<CombosPage />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it('handles undefined data (not loading)', async () => {
    const { useCombos, useArchiveCombo } = await vi.importMock<{
      useCombos: ReturnType<typeof vi.fn>;
      useArchiveCombo: ReturnType<typeof vi.fn>;
    }>('@/services/combos');
    useCombos.mockReturnValue({ data: undefined, isLoading: false });
    useArchiveCombo.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    const { default: CombosPage } = await import('../page');
    render(<CombosPage />);
    expect(
      screen.getByText(/nenhum resultado encontrado/i),
    ).toBeInTheDocument();
  });

  it('confirms archive from row actions', async () => {
    const archiveMutateAsync = vi.fn().mockResolvedValue(undefined);
    const { useCombos, useArchiveCombo } = await vi.importMock<{
      useCombos: ReturnType<typeof vi.fn>;
      useArchiveCombo: ReturnType<typeof vi.fn>;
    }>('@/services/combos');
    useCombos.mockReturnValue({
      data: [mockActiveCombo],
      isLoading: false,
    });
    useArchiveCombo.mockReturnValue({
      mutateAsync: archiveMutateAsync,
      isPending: false,
    });
    const { default: CombosPage } = await import('../page');
    render(<CombosPage />);

    const actionButtons = screen.getAllByRole('button', { name: /ações/i });
    await userEvent.click(actionButtons[0]!);
    await userEvent.click(screen.getByText(/arquivar/i));
    // Confirm the archive dialog
    const confirmBtns = screen.getAllByRole('button', { name: /arquivar/i });
    await userEvent.click(confirmBtns[confirmBtns.length - 1]!);

    await waitFor(() => {
      expect(archiveMutateAsync).toHaveBeenCalledWith('combo-1');
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from '../confirm-dialog';

describe('ConfirmDialog', () => {
  it('opens when trigger is clicked', async () => {
    render(
      <ConfirmDialog
        title="Delete item"
        description="Are you sure?"
        onConfirm={vi.fn()}
        trigger={<button>Delete</button>}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when Confirmar is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmDialog
        title="Delete item"
        description="Are you sure?"
        onConfirm={onConfirm}
        trigger={<button>Delete</button>}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('renders custom confirmLabel', async () => {
    render(
      <ConfirmDialog
        title="Delete item"
        description="Are you sure?"
        confirmLabel="Excluir"
        onConfirm={vi.fn()}
        trigger={<button>Delete</button>}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('shows loading state while onConfirm executes', async () => {
    let resolve: () => void;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    render(
      <ConfirmDialog
        title="Delete item"
        description="Are you sure?"
        onConfirm={onConfirm}
        trigger={<button>Delete</button>}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    resolve!();
  });
});

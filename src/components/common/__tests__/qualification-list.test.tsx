import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QualificationList } from '../qualification-list';
import type { QualificationListItem } from '../qualification-list';

const ITEMS: QualificationListItem[] = [
  { id: 'svc-1', label: 'Corte de Cabelo' },
  { id: 'svc-2', label: 'Manicure', sublabel: 'Serviço popular' },
];

describe('QualificationList', () => {
  it('renders items with their labels', () => {
    render(<QualificationList items={ITEMS} onRemove={vi.fn()} />);
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    expect(screen.getByText('Manicure')).toBeInTheDocument();
    expect(screen.getByText('Serviço popular')).toBeInTheDocument();
  });

  it('shows empty message when items is empty', () => {
    render(
      <QualificationList
        items={[]}
        onRemove={vi.fn()}
        emptyMessage="Nenhuma qualificação atribuída."
      />,
    );
    expect(
      screen.getByText('Nenhuma qualificação atribuída.'),
    ).toBeInTheDocument();
  });

  it('shows loading message when isLoading is true', () => {
    render(<QualificationList items={[]} onRemove={vi.fn()} isLoading />);
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renders remove buttons when canRemove is true', () => {
    render(<QualificationList items={ITEMS} onRemove={vi.fn()} canRemove />);
    expect(screen.getAllByRole('button', { name: /remover/i })).toHaveLength(2);
  });

  it('hides remove buttons when canRemove is false', () => {
    render(
      <QualificationList items={ITEMS} onRemove={vi.fn()} canRemove={false} />,
    );
    expect(screen.queryByRole('button', { name: /remover/i })).toBeNull();
  });

  it('calls onRemove with item id after confirmation', async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(<QualificationList items={ITEMS} onRemove={onRemove} canRemove />);

    await userEvent.click(
      screen.getByRole('button', { name: /remover corte de cabelo/i }),
    );
    const confirmBtn = await screen.findByRole('button', { name: 'Remover' });
    await userEvent.click(confirmBtn);

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('svc-1'));
  });

  it('opens confirmation dialog when remove button is clicked', async () => {
    render(<QualificationList items={ITEMS} onRemove={vi.fn()} canRemove />);

    await userEvent.click(
      screen.getByRole('button', { name: /remover corte de cabelo/i }),
    );
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });
});

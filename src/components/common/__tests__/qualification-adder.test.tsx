import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QualificationAdder } from '../qualification-adder';
import type { QualificationOption } from '../qualification-adder';

const OPTIONS: QualificationOption[] = [
  { id: 'svc-1', label: 'Corte de Cabelo' },
  { id: 'svc-2', label: 'Manicure' },
];

describe('QualificationAdder', () => {
  it('renders placeholder text when nothing is selected', () => {
    render(
      <QualificationAdder
        options={OPTIONS}
        onAdd={vi.fn()}
        placeholder="Selecione um serviço..."
      />,
    );
    expect(screen.getByText('Selecione um serviço...')).toBeInTheDocument();
  });

  it('Add button is disabled when no option is selected', () => {
    render(
      <QualificationAdder
        options={OPTIONS}
        onAdd={vi.fn()}
        addLabel="Adicionar"
      />,
    );
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });

  it('calls onAdd with the selected option id when button is clicked', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <QualificationAdder
        options={OPTIONS}
        onAdd={onAdd}
        addLabel="Adicionar"
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Corte de Cabelo'));
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('svc-1'));
  });

  it('resets selection after successful add', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <QualificationAdder
        options={OPTIONS}
        onAdd={onAdd}
        placeholder="Selecione..."
        addLabel="Adicionar"
      />,
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText('Corte de Cabelo'));
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() =>
      expect(screen.getByText('Selecione...')).toBeInTheDocument(),
    );
  });

  it('disables select and button while isLoading is true', () => {
    render(
      <QualificationAdder
        options={OPTIONS}
        onAdd={vi.fn()}
        isLoading
        addLabel="Adicionar"
      />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });
});

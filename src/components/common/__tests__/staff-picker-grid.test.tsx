import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QualifiedStaff } from '@/types/qualification';

import { StaffPickerGrid } from '../staff-picker-grid';

const MOCK_STAFF: QualifiedStaff[] = [
  { user_id: 'u1', name: 'Ana Lima', email: 'ana@example.com' },
  { user_id: 'u2', name: 'Bruno Costa', email: 'bruno@example.com' },
];

describe('StaffPickerGrid', () => {
  it('renders "Qualquer Profissional" option always', () => {
    render(
      <StaffPickerGrid staff={[]} selectedStaffId={null} onSelect={vi.fn()} />,
    );
    expect(
      screen.getByRole('button', { name: /qualquer profissional/i }),
    ).toBeInTheDocument();
  });

  it('renders a button for each staff member', () => {
    render(
      <StaffPickerGrid
        staff={MOCK_STAFF}
        selectedStaffId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
  });

  it('marks the selected staff button as aria-pressed', () => {
    render(
      <StaffPickerGrid
        staff={MOCK_STAFF}
        selectedStaffId="u1"
        onSelect={vi.fn()}
      />,
    );
    const pressedButtons = screen.getAllByRole('button', { pressed: true });
    expect(pressedButtons).toHaveLength(1);
    expect(pressedButtons[0]).toHaveTextContent('Ana Lima');
  });

  it('marks "Qualquer Profissional" as pressed when "any" is selected', () => {
    render(
      <StaffPickerGrid
        staff={MOCK_STAFF}
        selectedStaffId="any"
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', {
        name: /qualquer profissional/i,
        pressed: true,
      }),
    ).toBeInTheDocument();
  });

  it('calls onSelect with "any" and label when "Qualquer Profissional" is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <StaffPickerGrid
        staff={MOCK_STAFF}
        selectedStaffId={null}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /qualquer profissional/i }),
    );
    expect(onSelect).toHaveBeenCalledWith('any', 'Qualquer Profissional');
  });

  it('calls onSelect with staff id and name when a staff button is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <StaffPickerGrid
        staff={MOCK_STAFF}
        selectedStaffId={null}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByText('Ana Lima'));
    expect(onSelect).toHaveBeenCalledWith('u1', 'Ana Lima');
  });

  it('shows skeleton loaders when isLoading is true', () => {
    const { container } = render(
      <StaffPickerGrid
        staff={[]}
        selectedStaffId={null}
        onSelect={vi.fn()}
        isLoading
      />,
    );
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

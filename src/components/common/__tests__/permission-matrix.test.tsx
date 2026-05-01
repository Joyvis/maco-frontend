import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { RolePermission } from '@/types/role';
import {
  RESOURCES,
  ACTIONS,
  RESOURCE_LABELS,
  ACTION_LABELS,
} from '@/types/role';

import { PermissionMatrix } from '../permission-matrix';

describe('PermissionMatrix', () => {
  it('renders all resource rows', () => {
    render(<PermissionMatrix value={[]} onChange={vi.fn()} />);
    for (const resource of RESOURCES) {
      expect(screen.getByText(RESOURCE_LABELS[resource])).toBeInTheDocument();
    }
  });

  it('renders all action column headers', () => {
    render(<PermissionMatrix value={[]} onChange={vi.fn()} />);
    for (const action of ACTIONS) {
      expect(screen.getAllByText(ACTION_LABELS[action]).length).toBeGreaterThan(
        0,
      );
    }
  });

  it('checks checkboxes for provided permissions', () => {
    const value: RolePermission[] = [
      { resource: 'users', action: 'read' },
      { resource: 'roles', action: 'create' },
    ];
    render(<PermissionMatrix value={value} onChange={vi.fn()} />);

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const checked = checkboxes.filter((cb) => cb.checked);
    expect(checked).toHaveLength(2);
  });

  it('calls onChange when a checkbox is toggled on', async () => {
    const onChange = vi.fn();
    render(<PermissionMatrix value={[]} onChange={onChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    const newValue: RolePermission[] = onChange.mock
      .calls[0]?.[0] as RolePermission[];
    expect(newValue.length).toBe(1);
  });

  it('calls onChange removing permission when unchecking', async () => {
    const value: RolePermission[] = [{ resource: 'users', action: 'read' }];
    const onChange = vi.fn();
    render(<PermissionMatrix value={value} onChange={onChange} />);

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    const checked = checkboxes.find((cb) => cb.checked);
    await userEvent.click(checked!);
    expect(onChange).toHaveBeenCalledTimes(1);
    const newValue: RolePermission[] = onChange.mock
      .calls[0]?.[0] as RolePermission[];
    expect(newValue).toHaveLength(0);
  });

  it('disables all checkboxes when readOnly is true', () => {
    const value: RolePermission[] = [{ resource: 'users', action: 'read' }];
    render(<PermissionMatrix value={value} onChange={vi.fn()} readOnly />);

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    checkboxes.forEach((cb) => expect(cb).toBeDisabled());
  });
});

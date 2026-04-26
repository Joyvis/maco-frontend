import { render, screen } from '@testing-library/react';

import type { Permission } from '@/types/permissions';

import { PermissionsProvider, usePermissions } from '../permissions-provider';

function TestConsumer({ permission }: { permission: Permission }) {
  const { hasPermission } = usePermissions();
  return <div>{hasPermission(permission) ? 'allowed' : 'denied'}</div>;
}

describe('PermissionsProvider', () => {
  it('grants permissions that are in the list', () => {
    render(
      <PermissionsProvider permissions={['dashboard:read']}>
        <TestConsumer permission="dashboard:read" />
      </PermissionsProvider>,
    );
    expect(screen.getByText('allowed')).toBeInTheDocument();
  });

  it('denies permissions not in the list', () => {
    render(
      <PermissionsProvider permissions={['dashboard:read']}>
        <TestConsumer permission="team:manage" />
      </PermissionsProvider>,
    );
    expect(screen.getByText('denied')).toBeInTheDocument();
  });

  it('throws when usePermissions is used outside provider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(() =>
      render(<TestConsumer permission="dashboard:read" />),
    ).toThrow();
    consoleError.mockRestore();
  });
});

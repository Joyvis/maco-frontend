'use client';

import { createContext, useContext } from 'react';
import type { Permission } from '@/types/permissions';

interface PermissionsContextValue {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

const MOCK_PERMISSIONS: Permission[] = [
  'dashboard:read',
  'orders:read',
  'orders:write',
  'catalog:read',
  'catalog:write',
  'team:read',
  'team:manage',
  'settings:read',
  'settings:admin',
];

interface PermissionsProviderProps {
  children: React.ReactNode;
  permissions?: Permission[];
}

export function PermissionsProvider({
  children,
  permissions = MOCK_PERMISSIONS,
}: PermissionsProviderProps) {
  const hasPermission = (permission: Permission) => permissions.includes(permission);
  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}

import type { Permission } from '@/types/permissions';

export const MOCK_PERMISSIONS: Permission[] = [
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

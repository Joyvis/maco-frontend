export type Permission =
  | 'dashboard:read'
  | 'orders:read'
  | 'orders:write'
  | 'catalog:read'
  | 'catalog:write'
  | 'team:read'
  | 'team:manage'
  | 'settings:read'
  | 'settings:admin';

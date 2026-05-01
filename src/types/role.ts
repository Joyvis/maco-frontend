export const RESOURCES = [
  'tenants',
  'users',
  'roles',
  'services',
  'products',
  'orders',
  'payments',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export const RESOURCE_LABELS: Record<Resource, string> = {
  tenants: 'Inquilinos',
  users: 'Usuários',
  roles: 'Papéis',
  services: 'Serviços',
  products: 'Produtos',
  orders: 'Pedidos',
  payments: 'Pagamentos',
};

export const ACTION_LABELS: Record<Action, string> = {
  create: 'Criar',
  read: 'Ler',
  update: 'Atualizar',
  delete: 'Excluir',
};

export interface RolePermission {
  resource: Resource;
  action: Action;
}

export interface Role {
  id: string;
  name: string;
  is_system: boolean;
  user_count: number;
  created_at: string;
  permissions: RolePermission[];
}

export interface RoleUser {
  id: string;
  name: string;
  email: string;
}

export interface CreateRoleInput {
  name: string;
  permissions: RolePermission[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: RolePermission[];
}

export interface RoleFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  page?: number;
  page_size?: number;
}

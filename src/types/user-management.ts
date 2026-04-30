export interface Role {
  id: string;
  name: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: 'active' | 'inactive';
  created_at: string;
}

export interface UserFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  status?: 'active' | 'inactive';
  role_id?: string;
  search?: string;
}

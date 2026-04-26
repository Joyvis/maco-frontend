export interface Permission {
  resource: string;
  action: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  roles: string[];
  permissions: Permission[];
}

export interface JWTPayload {
  sub: string;
  email: string;
  tenant_id: string;
  roles: string[];
  permissions: Permission[];
  exp: number;
  iat: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthContextValue {
  user: User | null;
  tenant: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

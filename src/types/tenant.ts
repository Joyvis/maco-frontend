export interface Tenant {
  id: string;
  name: string;
  account_type: 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  contact_email?: string;
  contact_phone?: string;
}

export interface TenantConfig {
  key: string;
  value: string;
  group: 'general' | 'business_hours' | 'notifications';
}

export interface UpdateTenantPayload {
  name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateTenantConfigsPayload {
  configs: TenantConfig[];
}

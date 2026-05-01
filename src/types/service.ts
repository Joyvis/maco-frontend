export type ServiceStatus = 'draft' | 'active' | 'archived';

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};

export interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  duration_minutes: number;
  base_price: number;
  status: ServiceStatus;
  created_at: string;
}

export interface ServiceConsumption {
  product_id: string;
  product_name?: string;
  quantity_per_use: number;
}

export interface ServiceDependency {
  id: string;
  service_id: string;
  service_name?: string;
  auto_include: boolean;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  category?: string;
  duration_minutes: number;
  base_price: number;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  category?: string;
  duration_minutes?: number;
  base_price?: number;
}

export interface AddConsumptionInput {
  product_id: string;
  quantity_per_use: number;
}

export interface AddDependencyInput {
  service_id: string;
  auto_include: boolean;
}

export interface ServiceFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  status?: ServiceStatus;
  category?: string;
  page?: number;
  page_size?: number;
}

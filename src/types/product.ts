export type ProductStatus = 'draft' | 'active' | 'archived';

export type ProductUnit = 'ml' | 'g' | 'unit' | 'kg' | 'l';

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  ml: 'ml',
  g: 'g',
  unit: 'Unidade',
  kg: 'kg',
  l: 'Litro',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit: ProductUnit;
  base_price: number;
  status: ProductStatus;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category?: string;
  unit: ProductUnit;
  base_price: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string;
  unit?: ProductUnit;
  base_price?: number;
}

export interface ProductFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  status?: ProductStatus;
  category?: string;
  page?: number;
  page_size?: number;
}

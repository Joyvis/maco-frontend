export type ComboStatus = 'active' | 'archived';

export const COMBO_STATUS_LABELS: Record<ComboStatus, string> = {
  active: 'Ativo',
  archived: 'Arquivado',
};

export type ComboItemType = 'service' | 'product';

export const COMBO_ITEM_TYPE_LABELS: Record<ComboItemType, string> = {
  service: 'Serviço',
  product: 'Produto',
};

export interface ComboItem {
  id: string;
  item_type: ComboItemType;
  item_id: string;
  name: string;
  base_price: number;
}

export interface ComboSummary {
  id: string;
  name: string;
  description?: string;
  discount_percentage: number;
  status: ComboStatus;
  item_count: number;
  created_at: string;
}

export interface Combo extends ComboSummary {
  items: ComboItem[];
}

export interface CreateComboInput {
  name: string;
  description?: string;
  discount_percentage: number;
  items: Array<{ item_type: ComboItemType; item_id: string }>;
}

export interface UpdateComboInput {
  name?: string;
  description?: string;
  discount_percentage?: number;
  items?: Array<{ item_type: ComboItemType; item_id: string }>;
}

export interface ComboFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  status?: ComboStatus;
  page?: number;
  page_size?: number;
}

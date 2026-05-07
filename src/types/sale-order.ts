export type { SaleOrderState } from '@/types/appointment';
import type { SaleOrderState } from '@/types/appointment';

export const SALE_ORDER_STATE_LABELS: Record<SaleOrderState, string> = {
  confirmed: 'Confirmado',
  checked_in: 'Check-in',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
  pending_payment: 'Aguardando Pagamento',
  pending_checkout: 'Aguardando Checkout',
};

export type OrderItemType = 'service' | 'product';

export const ORDER_ITEM_TYPE_LABELS: Record<OrderItemType, string> = {
  service: 'Serviço',
  product: 'Produto',
};

export interface SaleOrderItem {
  id: string;
  name: string;
  type: OrderItemType;
  price: number;
  quantity: number;
}

export interface ManagedSaleOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_id?: string;
  state: SaleOrderState;
  total_amount: number;
  staff_name?: string;
  staff_id?: string;
  items: SaleOrderItem[];
  prepayment_required: boolean;
  created_at: string;
}

export interface SaleOrderFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  state?: SaleOrderState;
  date_from?: string;
  date_to?: string;
  staff_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CreateSaleOrderInput {
  customer_name: string;
  customer_id?: string;
}

export interface AddOrderItemInput {
  item_id: string;
  item_type: OrderItemType;
  quantity: number;
}

export interface AssignStaffInput {
  staff_id: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  type: OrderItemType;
  price: number;
}

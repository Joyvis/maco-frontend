export type AdminSaleOrderState =
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'pending_checkout'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const ADMIN_ORDER_STATE_LABELS: Record<AdminSaleOrderState, string> = {
  pending_payment: 'Aguardando Pagamento',
  confirmed: 'Confirmado',
  checked_in: 'Check-in Realizado',
  in_progress: 'Em Atendimento',
  pending_checkout: 'Aguardando Checkout',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
};

export const ORDER_FLOW_STATES: AdminSaleOrderState[] = [
  'pending_payment',
  'confirmed',
  'checked_in',
  'in_progress',
  'pending_checkout',
  'completed',
];

export interface AdminSaleOrder {
  id: string;
  order_number: string;
  state: AdminSaleOrderState;
  customer_name: string;
  assigned_staff?: string;
  created_at: string;
  balance_due: number;
  total_amount: number;
}

export interface SaleOrderItem {
  id: string;
  service_id: string;
  service_name: string;
  quantity: number;
  price_snapshot: number;
  subtotal: number;
}

export interface SaleOrderPayment {
  id: string;
  amount: number;
  status: string;
  method: string;
  created_at: string;
}

export interface SaleOrderHistoryEntry {
  id: string;
  from_state: AdminSaleOrderState | null;
  to_state: AdminSaleOrderState;
  actor?: string;
  created_at: string;
}

export interface AdminOrderFilters extends Record<
  string,
  string | number | boolean | undefined
> {
  state?: AdminSaleOrderState;
  page?: number;
  page_size?: number;
}

export interface CancelAdminOrderInput {
  reason: string;
}

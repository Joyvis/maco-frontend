export type SaleOrderState =
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface SaleOrder {
  id: string;
  state: SaleOrderState;
  scheduled_at: string;
  service_name: string;
  professional_name?: string;
  total_amount: number;
  created_at: string;
}

export interface RefundPolicy {
  id: string;
  description: string;
  refund_percentage: number;
}

export interface AvailabilitySlot {
  datetime: string;
  available: boolean;
}

export interface CancelOrderInput {
  reason: string;
}

export interface RescheduleOrderInput {
  new_datetime: string;
}

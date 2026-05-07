export const ANY_STAFF_ID = 'any';

export interface TimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface BookingStaff {
  user_id: string;
  name: string;
}

export interface BookingItem {
  service_id: string;
  service_name: string;
  price: number;
  included: boolean;
}

export interface CreateBookingInput {
  service_id: string;
  shop_slug: string;
  date: string;
  start_time: string;
  staff_id?: string;
}

export interface BookingResult {
  id: string;
  requires_payment: boolean;
  payment_url?: string;
}

export interface BookingWizardState {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  shopSlug: string;
  date: string | null;
  timeSlot: TimeSlot | null;
  staffId: string | null;
  staffName: string | null;
  items: BookingItem[];
}

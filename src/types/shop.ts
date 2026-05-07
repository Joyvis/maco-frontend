export interface ShopService {
  id: string;
  name: string;
  description?: string;
  category?: string;
  duration_minutes: number;
  base_price: number;
}

export interface ShopStaff {
  user_id: string;
  name: string;
  photo_url?: string;
  qualified_services: Array<{ id: string; name: string }>;
}

export interface ShopProfile {
  slug: string;
  name: string;
  logo_url?: string;
  city?: string;
  rating?: number;
  services: ShopService[];
  staff: ShopStaff[];
}

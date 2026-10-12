export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  parent_id: string | null;
  created_at?: string;
}

export interface Dish {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  ingredients: string[];
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_daily_menu: boolean;
  is_side_dish: boolean;
  side_dish_group: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateDishDTO = Omit<Dish, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDishDTO = Partial<CreateDishDTO>;
export type CreateCategoryDTO = Omit<Category, 'id' | 'created_at'>;
export type CategoryFilter = 'all' | 'daily' | string;
export type PickupType = 'tienda' | 'delivery';

export interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
}

export interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  sideDishes?: { id: string; name: string; price: number }[];
}

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'dispatched';

export interface Order {
  id: string;
  order_number?: number | null;
  client_token?: string | null;
  customer_name: string | null;
  items: OrderItem[];
  total_usd: number;
  total_bs: number | null;
  rate_usd: number | null;
  pickup_type: PickupType;
  delivery_zone: string | null;
  delivery_cost: number | null;
  delivery_reference: string | null;
  status: OrderStatus;
  created_at: string;
}

export type AdminSection =
  | 'menu'
  | 'rate'
  | 'promos'
  | 'categories'
  | 'contornos'
  | 'daily-menu'
  | 'history'
  | 'delivery-zones'
  | 'orders'
  | 'schedule';

export interface ScheduleDay {
  day: number; // 0 = Domingo … 6 = Sábado
  isOpen: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface RestaurantSchedule {
  enabled: boolean;
  days: ScheduleDay[];
}

export interface OrderPayload {
  dishName: string;
  price: number;
  customNotes?: string;
}

export interface Promo {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  duration_seconds: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export type CreatePromoDTO = Omit<Promo, 'id' | 'created_at'>;

export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  sideDishes?: { id: string; name: string; price: number }[];
}

export type RateMode = 'bcv' | 'custom';

export interface RateSettings {
  mode: RateMode;
  adjustPercent: number;
}

export interface BcvRate {
  rate: number;
  updatedAt: string | null;
  /** true si la fecha de la tasa quedó 2+ días hábiles atrás (ej: viernes visto el martes). */
  isStale?: boolean;
}

export interface UsdRateInfo {
  rate: number;
  source: RateMode;
  bcvRate: number;
  adjustPercent: number;
  updatedAt: string | null;
  isStale?: boolean;
}

export interface RateConfig {
  settings: RateSettings;
  bcv: BcvRate | null;
  effective: UsdRateInfo | null;
}
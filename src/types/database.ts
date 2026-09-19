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

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  note?: string;
  sideDishes?: { id: string; name: string; price: number }[];
}

export interface Order {
  id: string;
  customer_name: string | null;
  items: OrderItem[];
  total_usd: number;
  total_bs: number | null;
  rate_usd: number | null;
  pickup_type: PickupType;
  created_at: string;
}

export type AdminSection = 'menu' | 'rate' | 'promos' | 'categories' | 'contornos' | 'daily-menu' | 'history';

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
}

export interface UsdRateInfo {
  rate: number;
  source: RateMode;
  bcvRate: number;
  adjustPercent: number;
  updatedAt: string | null;
}

export interface RateConfig {
  settings: RateSettings;
  bcv: BcvRate | null;
  effective: UsdRateInfo | null;
}
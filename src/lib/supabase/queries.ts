import { createClient } from '@/lib/supabase/server';
import type { Category, DeliveryZone, Dish, Order, Promo, RateSettings, RestaurantSchedule } from '@/types/database';

export interface QueryResult<T> {
  data: T;
  error: string | null;
}

const DEFAULT_RATE_SETTINGS: RateSettings = { mode: 'bcv', adjustPercent: 0 };

export async function getRateSettings(): Promise<QueryResult<RateSettings>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('app_settings').select('key, value');
    if (error) return { data: DEFAULT_RATE_SETTINGS, error: error.message };

    const values = new Map(
      (data ?? []).map((row: { key: string; value: string }) => [row.key, row.value])
    );
    const percentValue = Number(values.get('usd_rate_adjust_percent'));
    return {
      data: {
        mode: values.get('usd_rate_mode') === 'custom' ? 'custom' : 'bcv',
        adjustPercent: Number.isFinite(percentValue) ? percentValue : 0,
      },
      error: null,
    };
  } catch (e) {
    return {
      data: DEFAULT_RATE_SETTINGS,
      error: e instanceof Error ? e.message : 'Unexpected error',
    };
  }
}

async function fetchPromos(activeOnly: boolean): Promise<QueryResult<Promo[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('promos')
      .select('*')
      .order('display_order', { ascending: true });

    if (activeOnly) query = query.eq('is_active', true);

    const { data, error } = await query;

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export function getActivePromos() {
  return fetchPromos(true);
}

export function getAllPromos() {
  return fetchPromos(false);
}

export async function getCategories(): Promise<QueryResult<Category[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function getDishes(
  categoryId?: string,
  dailyOnly?: boolean
): Promise<QueryResult<Dish[]>> {
  try {
    const supabase = await createClient();
    let query = supabase.from('dishes').select('*');

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }
    if (dailyOnly) {
      query = query.eq('is_daily_menu', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function getOrders(): Promise<QueryResult<Order[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data as Order[]) ?? [], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'centro', name: 'Centro', cost: 1.0 },
  { id: 'la-llovizna', name: 'La Llovizna', cost: 1.5 },
  { id: 'san-felix', name: 'San Félix', cost: 2.0 },
  { id: 'villa-bolivia', name: 'Villa Bolivia', cost: 1.5 },
  { id: 'alta-vista', name: 'Alta Vista', cost: 2.0 },
  { id: 'los-pueblos', name: 'Los Pueblos', cost: 2.5 },
  { id: 'el-roble', name: 'El Roble', cost: 2.0 },
  { id: 'paragua', name: 'Paragua', cost: 3.0 },
];

export async function getDeliveryZones(): Promise<QueryResult<DeliveryZone[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'delivery_zones')
      .maybeSingle();
    if (error || !data) return { data: DEFAULT_DELIVERY_ZONES, error: error?.message ?? null };
    try {
      const parsed = JSON.parse(data.value) as DeliveryZone[];
      return { data: parsed.length > 0 ? parsed : DEFAULT_DELIVERY_ZONES, error: null };
    } catch {
      return { data: DEFAULT_DELIVERY_ZONES, error: null };
    }
  } catch (e) {
    return { data: DEFAULT_DELIVERY_ZONES, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export function getDefaultSchedule(): RestaurantSchedule {
  return {
    enabled: false,
    days: [
      { day: 0, isOpen: true, open: '12:00', close: '23:00' },
      { day: 1, isOpen: true, open: '11:00', close: '22:00' },
      { day: 2, isOpen: true, open: '11:00', close: '22:00' },
      { day: 3, isOpen: true, open: '11:00', close: '22:00' },
      { day: 4, isOpen: true, open: '11:00', close: '22:00' },
      { day: 5, isOpen: true, open: '11:00', close: '22:00' },
      { day: 6, isOpen: true, open: '12:00', close: '23:00' },
    ],
  };
}

export async function getRestaurantSchedule(): Promise<QueryResult<RestaurantSchedule>> {
  const fallback = getDefaultSchedule();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'restaurant_schedule')
      .maybeSingle();
    if (error || !data) return { data: fallback, error: error?.message ?? null };
    try {
      const parsed = JSON.parse(data.value) as RestaurantSchedule;
      if (typeof parsed.enabled !== 'boolean' || !Array.isArray(parsed.days) || parsed.days.length !== 7) {
        return { data: fallback, error: null };
      }
      const days = [...parsed.days].sort((a, b) => a.day - b.day);
      return { data: { enabled: parsed.enabled, days }, error: null };
    } catch {
      return { data: fallback, error: null };
    }
  } catch (e) {
    return { data: fallback, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function getMenuTemplate(): Promise<QueryResult<string | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'menu_template_url')
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: data?.value || null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

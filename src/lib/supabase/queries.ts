import { createClient } from '@/lib/supabase/server';
import type { Category, Dish, Promo, RateSettings } from '@/types/database';

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

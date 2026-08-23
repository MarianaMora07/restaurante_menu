import { createClient } from '@/lib/supabase/server';
import type { Category, Dish, Promo } from '@/types/database';

export interface QueryResult<T> {
  data: T;
  error: string | null;
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

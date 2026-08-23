'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreateDishDTO } from '@/types/database';

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function updateDishFlag(
  dishId: string,
  field: 'is_available' | 'is_daily_menu',
  value: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('dishes')
      .update({ [field]: value })
      .eq('id', dishId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function toggleDishAvailability(
  dishId: string,
  isAvailable: boolean
): Promise<ActionResult> {
  return updateDishFlag(dishId, 'is_available', isAvailable);
}

export async function toggleDailyMenu(
  dishId: string,
  isDaily: boolean
): Promise<ActionResult> {
  return updateDishFlag(dishId, 'is_daily_menu', isDaily);
}

export async function saveDish(
  payload: CreateDishDTO & { id?: string }
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { id, ...dishData } = payload;
    const { error } = id
      ? await supabase.from('dishes').update(dishData).eq('id', id)
      : await supabase.from('dishes').insert(dishData);

    if (error) return { success: false, error: error.message };

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function deleteDish(dishId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('dishes').delete().eq('id', dishId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

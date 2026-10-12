'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { DishPayloadSchema } from '@/lib/validation';

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
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from('dishes')
      .update({ [field]: value })
      .eq('id', dishId);

    if (error) return { success: false, error: 'No se pudo actualizar el plato.' };

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

export async function saveDish(payload: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = DishPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const { id, ...dishData } = parsed.data;

    const supabase = await createClient();
    const { error } = id
      ? await supabase.from('dishes').update(dishData).eq('id', id)
      : await supabase.from('dishes').insert(dishData);

    if (error) return { success: false, error: 'No se pudo guardar el plato.' };

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function deleteDish(dishId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from('dishes').delete().eq('id', dishId);

    if (error) return { success: false, error: 'No se pudo eliminar el plato.' };

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

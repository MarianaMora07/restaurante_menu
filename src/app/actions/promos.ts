'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreatePromoDTO } from '@/types/database';
import type { ActionResult } from './dishes';

function revalidateViews() {
  revalidatePath('/');
  revalidatePath('/dashboard');
}

export async function savePromo(
  payload: CreatePromoDTO & { id?: string }
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { id, ...promoData } = payload;
    const { error } = id
      ? await supabase.from('promos').update(promoData).eq('id', id)
      : await supabase.from('promos').insert(promoData);

    if (error) return { success: false, error: error.message };

    revalidateViews();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function togglePromoActive(
  promoId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('promos')
      .update({ is_active: isActive })
      .eq('id', promoId);

    if (error) return { success: false, error: error.message };

    revalidateViews();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function deletePromo(promoId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('promos').delete().eq('id', promoId);

    if (error) return { success: false, error: error.message };

    revalidateViews();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

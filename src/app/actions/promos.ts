'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { PromoPayloadSchema } from '@/lib/validation';
import type { ActionResult } from './dishes';

function revalidateViews() {
  revalidatePath('/');
  revalidatePath('/dashboard');
}

export async function savePromo(payload: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = PromoPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const { id, ...promoData } = parsed.data;

    const supabase = await createClient();
    const { error } = id
      ? await supabase.from('promos').update(promoData).eq('id', id)
      : await supabase.from('promos').insert(promoData);

    if (error) return { success: false, error: 'No se pudo guardar la promoción.' };

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
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from('promos')
      .update({ is_active: isActive })
      .eq('id', promoId);

    if (error) return { success: false, error: 'No se pudo actualizar la promoción.' };

    revalidateViews();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function deletePromo(promoId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from('promos').delete().eq('id', promoId);

    if (error) return { success: false, error: 'No se pudo eliminar la promoción.' };

    revalidateViews();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

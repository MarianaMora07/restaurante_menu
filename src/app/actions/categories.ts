'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { CategoryPayloadSchema } from '@/lib/validation';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function saveCategory(payload: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = CategoryPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
    }
    const { id, ...data } = parsed.data;

    const supabase = await createClient();
    const { error } = id
      ? await supabase.from('categories').update(data).eq('id', id)
      : await supabase.from('categories').insert(data);

    if (error) return { success: false, error: 'No se pudo guardar la categoría.' };
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { success: false, error: 'No se pudo eliminar la categoría.' };
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

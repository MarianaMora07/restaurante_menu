'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreateCategoryDTO } from '@/types/database';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function saveCategory(
  payload: CreateCategoryDTO & { id?: string }
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { id, ...data } = payload;
    const { error } = id
      ? await supabase.from('categories').update(data).eq('id', id)
      : await supabase.from('categories').insert(data);

    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

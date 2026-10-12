'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import {
  DeliveryZonesSchema,
  RateSettingsSchema,
  ScheduleSchema,
} from '@/lib/validation';
import type { ActionResult } from './dishes';

export async function saveRateSettings(payload: unknown): Promise<ActionResult> {
  const parsed = RateSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ajuste inválido.' };
  }

  try {
    await requireAdmin();
    const supabase = await createClient();
    const rows = [
      { key: 'usd_rate_mode', value: parsed.data.mode },
      {
        key: 'usd_rate_adjust_percent',
        value: String(Math.round(parsed.data.adjustPercent * 100) / 100),
      },
    ];
    const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
    if (error) return { success: false, error: 'No se pudo guardar la tasa.' };

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function saveDeliveryZones(zones: unknown): Promise<ActionResult> {
  const parsed = DeliveryZonesSchema.safeParse(zones);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Zonas inválidas.' };
  }

  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key: 'delivery_zones', value: JSON.stringify(parsed.data) },
        { onConflict: 'key' }
      );
    if (error) return { success: false, error: 'No se pudieron guardar las zonas.' };
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function saveSchedule(schedule: unknown): Promise<ActionResult> {
  const parsed = ScheduleSchema.safeParse(schedule);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Horario inválido.' };
  }

  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        {
          key: 'restaurant_schedule',
          value: JSON.stringify({
            enabled: parsed.data.enabled,
            days: [...parsed.data.days].sort((a, b) => a.day - b.day),
          }),
        },
        { onConflict: 'key' }
      );
    if (error) return { success: false, error: 'No se pudo guardar el horario.' };
    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function saveMenuTemplate(url: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'menu_template_url', value: url }, { onConflict: 'key' });
    if (error) return { success: false, error: 'No se pudo guardar la plantilla.' };
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function deleteMenuTemplate(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'menu_template_url', value: '' }, { onConflict: 'key' });
    if (error) return { success: false, error: 'No se pudo quitar la plantilla.' };
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

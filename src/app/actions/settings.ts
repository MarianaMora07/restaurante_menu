'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from './dishes';
import type { RateMode } from '@/types/database';

const MIN_ADJUST_PERCENT = -90;
const MAX_ADJUST_PERCENT = 500;

export async function saveRateSettings(payload: {
  mode: RateMode;
  adjustPercent: number;
}): Promise<ActionResult> {
  const mode: RateMode = payload.mode === 'custom' ? 'custom' : 'bcv';
  const adjustPercent = Number(payload.adjustPercent);
  if (
    !Number.isFinite(adjustPercent) ||
    adjustPercent < MIN_ADJUST_PERCENT ||
    adjustPercent > MAX_ADJUST_PERCENT
  ) {
    return {
      success: false,
      error: `El ajuste debe estar entre ${MIN_ADJUST_PERCENT}% y ${MAX_ADJUST_PERCENT}%.`,
    };
  }

  try {
    const supabase = await createClient();
    const rows = [
      { key: 'usd_rate_mode', value: mode },
      { key: 'usd_rate_adjust_percent', value: String(Math.round(adjustPercent * 100) / 100) },
    ];
    const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
    if (error) return { success: false, error: error.message };

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

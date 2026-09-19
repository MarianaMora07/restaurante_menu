'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { OrderItem, PickupType } from '@/types/database';

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function saveOrder(payload: {
  customer_name: string | null;
  items: OrderItem[];
  total_usd: number;
  total_bs: number | null;
  rate_usd: number | null;
  pickup_type: PickupType;
  delivery_zone?: string | null;
  delivery_cost?: number;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('orders').insert({
      customer_name: payload.customer_name,
      items: payload.items,
      total_usd: payload.total_usd,
      total_bs: payload.total_bs,
      rate_usd: payload.rate_usd,
      pickup_type: payload.pickup_type,
      delivery_zone: payload.delivery_zone ?? null,
      delivery_cost: payload.delivery_cost ?? 0,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

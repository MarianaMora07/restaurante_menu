'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Order, OrderItem, OrderStatus, PickupType } from '@/types/database';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface ActionResult {
  success: boolean;
  error?: string;
  order?: Order;
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
    console.log('[saveOrder] Iniciando...');
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: payload.customer_name,
        items: payload.items,
        total_usd: payload.total_usd,
        total_bs: payload.total_bs,
        rate_usd: payload.rate_usd,
        pickup_type: payload.pickup_type,
        delivery_zone: payload.delivery_zone ?? null,
        delivery_cost: payload.delivery_cost ?? 0,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[saveOrder] ERROR:', error.message, error.code, error.details);
      return { success: false, error: `${error.message} (${error.code})` };
    }

    console.log('[saveOrder] OK, id:', data.id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    console.error('[saveOrder] EXCEPTION:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[updateOrderStatus] ERROR:', error.message, error.code);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true, order: data as Order };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

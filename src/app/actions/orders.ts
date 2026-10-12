'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { getRateConfig } from '@/lib/bcv';
import { SaveOrderSchema } from '@/lib/validation';
import type { DeliveryZone, Order, OrderStatus } from '@/types/database';

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

async function loadDeliveryZones(): Promise<DeliveryZone[]> {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'delivery_zones')
    .maybeSingle();
  if (!data) return [];
  try {
    const parsed = JSON.parse(data.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveOrder(payload: unknown): Promise<ActionResult> {
  try {
    const parsed = SaveOrderSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Pedido inválido.' };
    }
    const input = parsed.data;

    // Idempotencia: si este token ya creó una orden, devolverla sin duplicar.
    if (input.client_token) {
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('client_token', input.client_token)
        .maybeSingle();
      if (existing) {
        return { success: true, order: existing as Order };
      }
    }

    const allIds = [
      ...input.items.map((i) => i.id),
      ...input.items.flatMap((i) => i.sideDishes?.map((s) => s.id) ?? []),
    ];
    const uniqueIds = [...new Set(allIds)];

    const [{ data: dishes, error: dishError }, zones, rateConfig] = await Promise.all([
      supabaseAdmin.from('dishes').select('id, name, price').in('id', uniqueIds),
      loadDeliveryZones(),
      getRateConfig(),
    ]);

    if (dishError) return { success: false, error: 'No se pudo validar el menú.' };
    const priceById = new Map((dishes ?? []).map((d) => [d.id, d]));

    let totalUsd = 0;
    const items = [];
    for (const item of input.items) {
      const dish = priceById.get(item.id);
      if (!dish) return { success: false, error: 'Un plato del pedido ya no está disponible.' };

      const sides = [];
      let sidesUnit = 0;
      for (const side of item.sideDishes ?? []) {
        const sideDish = priceById.get(side.id);
        if (!sideDish) return { success: false, error: 'Un contorno del pedido ya no está disponible.' };
        sidesUnit += sideDish.price;
        sides.push({ id: sideDish.id, name: sideDish.name, price: sideDish.price });
      }

      totalUsd += (dish.price + sidesUnit) * item.quantity;
      items.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: item.quantity,
        note: item.note?.trim() || undefined,
        sideDishes: sides.length > 0 ? sides : undefined,
      });
    }

    let deliveryZone: string | null = null;
    let deliveryCost = 0;
    if (input.pickup_type === 'delivery' && input.delivery_zone) {
      const zone = zones.find(
        (z) => z.name.toLowerCase() === input.delivery_zone!.trim().toLowerCase()
      );
      if (!zone) return { success: false, error: 'Zona de delivery inválida.' };
      deliveryZone = zone.name;
      deliveryCost = zone.cost;
      totalUsd += deliveryCost;
    }

    const rate = rateConfig.effective?.rate ?? null;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        client_token: input.client_token ?? null,
        customer_name: input.customer_name || null,
        items,
        total_usd: Math.round(totalUsd * 100) / 100,
        total_bs: rate ? Math.round(totalUsd * rate * 100) / 100 : null,
        rate_usd: rate,
        pickup_type: input.pickup_type,
        delivery_zone: deliveryZone,
        delivery_cost: deliveryCost,
        delivery_reference: input.delivery_reference || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // 23505 = unique violation en client_token: otra petición ganó la carrera.
      // Devolver la orden existente como éxito (idempotente).
      if (error.code === '23505' && input.client_token) {
        const { data: existing } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('client_token', input.client_token)
          .maybeSingle();
        if (existing) return { success: true, order: existing as Order };
      }
      return { success: false, error: 'No se pudo guardar la orden.' };
    }

    revalidatePath('/dashboard');
    return { success: true, order: data as Order };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

const ORDER_STATUSES = new Set<OrderStatus>([
  'pending',
  'paid',
  'preparing',
  'ready',
  'dispatched',
]);

/* Máquina de estados: transiciones válidas hacia adelante (sin saltos ni
   retrocesos). Despachar solo desde "ready". */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid'],
  paid: ['preparing'],
  preparing: ['ready'],
  ready: ['dispatched'],
  dispatched: [],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  expectedStatus?: OrderStatus
): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!ORDER_STATUSES.has(status)) {
      return { success: false, error: 'Estado inválido.' };
    }

    const supabase = await createServerClient();

    // UPDATE atómico con guarda de estado: solo aplica si la orden sigue en
    // el estado que el admin vio. Evita pisarse entre dos sesiones.
    let query = supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (expectedStatus && expectedStatus !== status) {
      if (!VALID_TRANSITIONS[expectedStatus]?.includes(status)) {
        return {
          success: false,
          error: `Transición no permitida: ${expectedStatus} → ${status}.`,
        };
      }
      query = query.eq('status', expectedStatus);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) return { success: false, error: 'No se pudo actualizar la orden.' };

    if (!data) {
      // 0 filas: la orden no existe o su estado cambió mientras se actuaba.
      const { data: current } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (!current) return { success: false, error: 'La orden ya no existe.' };
      return {
        success: false,
        error: `La orden cambió a "${current.status}" mientras actuabas. Refresca el panel.`,
        order: current as Order,
      };
    }

    revalidatePath('/dashboard');
    return { success: true, order: data as Order };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bike, Building2, CheckCircle2, Clock, ChefHat, Loader2, MapPin, Package, RefreshCw } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { updateOrderStatus } from '@/app/actions/orders';
import { cn, formatBolivares, formatPrice } from '@/lib/utils';

interface OrdersLiveSectionProps {
  initialOrders: Order[];
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock; bg: string }> = {
  pending: { label: 'Pendiente', color: 'text-amber-400', icon: Clock, bg: 'bg-amber-500/15 ring-amber-500/30' },
  paid: { label: 'Pagada', color: 'text-blue-400', icon: CheckCircle2, bg: 'bg-blue-500/15 ring-blue-500/30' },
  preparing: { label: 'En Preparación', color: 'text-orange-400', icon: ChefHat, bg: 'bg-orange-500/15 ring-orange-500/30' },
  ready: { label: 'Lista para Entregar', color: 'text-green-400', icon: Package, bg: 'bg-green-500/15 ring-green-500/30' },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'paid', 'preparing', 'ready'];

function getStatus(status: string | undefined): { key: OrderStatus; label: string; color: string; icon: typeof Clock; bg: string } {
  if (status && STATUS_CONFIG[status as OrderStatus]) {
    const s = status as OrderStatus;
    return { key: s, ...STATUS_CONFIG[s] };
  }
  return { key: 'pending', ...STATUS_CONFIG.pending };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function OrdersLiveSection({ initialOrders }: OrdersLiveSectionProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
            setNewIds((prev) => new Set(prev).add(newOrder.id));
            setTimeout(() => {
              setNewIds((prev) => {
                const next = new Set(prev);
                next.delete(newOrder.id);
                return next;
              });
            }, 3000);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setProcessingId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success && result.order) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? result.order! : o)));
    }
    setProcessingId(null);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = { pending: 0, paid: 0, preparing: 0, ready: 0 };
    for (const o of orders) c[o.status]++;
    return c;
  }, [orders]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-sm font-bold tracking-[0.16em] text-brand-light/50 uppercase">
            Órdenes Activas
          </h2>
          <span className="rounded-full bg-brand-primary/20 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            filter === 'all'
              ? 'bg-brand-primary text-brand-darker'
              : 'bg-white/[0.06] text-brand-light/50 hover:bg-white/[0.1]'
          )}
        >
          Todas ({orders.length})
        </button>
        {STATUS_FLOW.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                filter === s
                  ? cfg.bg + ' ' + cfg.color + ' ring-1'
                  : 'bg-white/[0.06] text-brand-light/50 hover:bg-white/[0.1]'
              )}
            >
              {cfg.label} ({counts[s]})
            </button>
          );
        })}
      </div>

      {/* Lista de órdenes */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <Package className="size-8 text-brand-light/15" aria-hidden />
          <p className="text-sm font-medium text-brand-light/40">
            {filter === 'all' ? 'No hay órdenes registradas.' : `No hay órdenes "${getStatus(filter).label}".`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const cfg = getStatus(order.status);
            const Icon = cfg.icon;
            const nextIdx = STATUS_FLOW.indexOf(order.status) + 1;
            const nextStatus = nextIdx < STATUS_FLOW.length ? STATUS_FLOW[nextIdx] : null;
            const isNew = newIds.has(order.id);

            return (
              <div
                key={order.id}
                className={cn(
                  'rounded-xl bg-brand-dark ring-1 ring-brand-primary/20 transition-all',
                  isNew && 'animate-pulse ring-brand-primary/50'
                )}
              >
                {/* Header de la orden */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
                    <Icon className={cn('size-4', cfg.color)} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-light">
                        {order.customer_name?.trim() || 'Sin nombre'}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-brand-light/40">
                      <span>{formatTime(order.created_at)}</span>
                      <span>·</span>
                      <span className={cn(
                        'flex items-center gap-1',
                        order.pickup_type === 'delivery' ? 'text-brand-primary/70' : ''
                      )}>
                        {order.pickup_type === 'delivery' ? <Bike className="size-3" /> : <Building2 className="size-3" />}
                        {order.pickup_type === 'delivery' ? 'Delivery' : 'Tienda'}
                      </span>
                      {order.pickup_type === 'delivery' && order.delivery_zone && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="size-2.5" />
                            {order.delivery_zone}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{timeAgo(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-primary">{formatPrice(order.total_usd)}</p>
                    {order.total_bs != null && (
                      <p className="text-[10px] text-brand-light/35">{formatBolivares(order.total_bs)}</p>
                    )}
                  </div>
                </div>

                {/* Detalle de items */}
                <div className="border-t border-white/[0.04] px-4 py-2.5">
                  <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-brand-light/55">
                        {item.quantity}x {item.name}
                        {item.sideDishes && item.sideDishes.length > 0 && (
                          <span className="text-brand-light/30">
                            {' '}+{item.sideDishes.map((s) => s.name).join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {order.items.some((it) => it.note?.trim()) && (
                    <p className="mt-1 text-[10px] italic text-brand-light/25">
                      Notas: {order.items.filter((it) => it.note?.trim()).map((it) => it.note!.trim()).join(' | ')}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                {nextStatus && (
                  <div className="border-t border-white/[0.04] px-4 py-2.5">
                    <button
                      type="button"
                      disabled={processingId === order.id}
                      onClick={() => handleStatusChange(order.id, nextStatus)}
                      className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all',
                        'bg-brand-accent/15 text-brand-primary ring-1 ring-brand-accent/30 hover:bg-brand-accent/25',
                        'disabled:opacity-50'
                      )}
                    >
                      {processingId === order.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          {nextStatus === 'paid' && <CheckCircle2 className="size-3.5" />}
                          {nextStatus === 'preparing' && <ChefHat className="size-3.5" />}
                          {nextStatus === 'ready' && <Package className="size-3.5" />}
                          Marcar como {STATUS_CONFIG[nextStatus].label}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

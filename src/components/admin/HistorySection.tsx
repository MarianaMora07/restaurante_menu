'use client';

import { useMemo, useState } from 'react';
import { Bike, Building2, ClipboardList } from 'lucide-react';
import type { Order } from '@/types/database';
import { cn, formatBolivares, formatPrice } from '@/lib/utils';

interface HistorySectionProps {
  orders: Order[];
}

type FilterPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

const PERIODS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'all', label: 'Todo' },
  { value: 'custom', label: 'Rango personalizado' },
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getDateRange(
  period: FilterPeriod,
  customFrom: string,
  customTo: string
): { from: Date; to: Date } {
  const now = new Date();
  const today = startOfDay(now);

  switch (period) {
    case 'today':
      return { from: today, to: endOfDay(now) };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: endOfDay(yesterday) };
    }
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { from: weekStart, to: endOfDay(now) };
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: monthStart, to: endOfDay(now) };
    }
    case 'custom': {
      const from = customFrom ? startOfDay(new Date(customFrom)) : today;
      const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      return { from, to };
    }
    case 'all':
    default:
      return { from: new Date(0), to: endOfDay(now) };
  }
}

function formatPeriodLabel(from: Date, to: Date): string {
  const fmt = new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}

function groupByDate(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>();
  const fmt = new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  for (const order of orders) {
    const d = new Date(order.created_at);
    const key = fmt.format(d);
    const list = map.get(key) ?? [];
    list.push(order);
    map.set(key, list);
  }

  return map;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function HistorySection({ orders }: HistorySectionProps) {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { from, to } = useMemo(
    () => getDateRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, from, to]);

  const stats = useMemo(() => {
    let totalUsd = 0;
    let totalBs = 0;
    let deliveryCount = 0;
    let tiendaCount = 0;

    for (const o of filtered) {
      totalUsd += o.total_usd;
      totalBs += o.total_bs ?? 0;
      if (o.pickup_type === 'delivery') deliveryCount++;
      else tiendaCount++;
    }

    return { totalUsd, totalBs, deliveryCount, tiendaCount };
  }, [filtered]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <h2 className="font-heading text-sm font-bold tracking-[0.16em] text-brand-light/50 uppercase">
          Historial de Pedidos
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                period === p.value
                  ? 'bg-brand-primary text-brand-darker'
                  : 'bg-white/[0.06] text-brand-light/50 hover:bg-white/[0.1]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-wider text-brand-light/40 uppercase">
              Desde
            </span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-brand-light ring-1 ring-white/10 focus:outline-none focus:ring-brand-primary/50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold tracking-wider text-brand-light/40 uppercase">
              Hasta
            </span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-brand-light ring-1 ring-white/10 focus:outline-none focus:ring-brand-primary/50"
            />
          </label>
        </div>
      )}

      <p className="text-[11px] font-medium text-brand-light/35">
        {formatPeriodLabel(from, to)}
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl bg-brand-dark p-3 ring-1 ring-brand-primary/20">
          <p className="font-heading text-[10px] font-semibold tracking-wider text-brand-light/40 uppercase">
            Total USD
          </p>
          <p className="mt-1 text-lg font-bold text-brand-light">
            {formatPrice(stats.totalUsd)}
          </p>
        </div>
        <div className="rounded-xl bg-brand-dark p-3 ring-1 ring-brand-primary/20">
          <p className="font-heading text-[10px] font-semibold tracking-wider text-brand-light/40 uppercase">
            Total BS
          </p>
          <p className="mt-1 text-lg font-bold text-brand-light">
            {formatBolivares(stats.totalBs)}
          </p>
        </div>
        <div className="rounded-xl bg-brand-dark p-3 ring-1 ring-brand-primary/20">
          <p className="font-heading text-[10px] font-semibold tracking-wider text-brand-light/40 uppercase">
            En Tienda
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-brand-light">
            <Building2 className="size-4 text-brand-primary/60" aria-hidden />
            {stats.tiendaCount}
          </p>
        </div>
        <div className="rounded-xl bg-brand-dark p-3 ring-1 ring-brand-primary/20">
          <p className="font-heading text-[10px] font-semibold tracking-wider text-brand-light/40 uppercase">
            Delivery
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-brand-light">
            <Bike className="size-4 text-brand-primary/60" aria-hidden />
            {stats.deliveryCount}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <ClipboardList className="size-8 text-brand-light/15" aria-hidden />
          <p className="text-sm font-medium text-brand-light/40">
            No hay pedidos en este periodo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from(grouped.entries()).map(([dateLabel, dateOrders]) => (
            <div key={dateLabel}>
              <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.16em] text-brand-light/35 uppercase">
                {dateLabel}
              </h3>
              <div className="flex flex-col gap-2">
                {dateOrders.map((order) => {
                  const isExpanded = expandedId === order.id;
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl bg-brand-dark ring-1 ring-brand-primary/20"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                      >
                        <span className="shrink-0 text-xs font-semibold text-brand-light/40">
                          {formatTime(order.created_at)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-light">
                          {order.customer_name?.trim() || 'Sin nombre'}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            order.pickup_type === 'delivery'
                              ? 'bg-brand-primary/15 text-brand-primary'
                              : 'bg-white/[0.08] text-brand-light/50'
                          )}
                        >
                          {order.pickup_type === 'delivery' ? 'Delivery' : 'Tienda'}
                        </span>
                        <span className="shrink-0 text-sm font-bold text-brand-light">
                          {formatPrice(order.total_usd)}
                        </span>
                        {order.total_bs != null && (
                          <span className="hidden shrink-0 text-xs text-brand-light/40 sm:inline">
                            {formatBolivares(order.total_bs)}
                          </span>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-white/[0.06] px-4 py-3">
                          <ul className="flex flex-col gap-2">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex flex-col gap-0.5">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-brand-light/80">
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span className="font-medium text-brand-light">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                                {item.sideDishes && item.sideDishes.length > 0 && (
                                  <div className="flex flex-col gap-0.5 pl-4">
                                    {item.sideDishes.map((sd, si) => (
                                      <span key={si} className="text-xs text-brand-light/40">
                                        + {sd.name} ({formatPrice(sd.price)})
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.note?.trim() && (
                                  <p className="pl-4 text-xs italic text-brand-light/30">
                                    {item.note}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                          {order.rate_usd && (
                            <p className="mt-2 border-t border-white/[0.06] pt-2 text-[11px] text-brand-light/30">
                              Tasa: {formatBolivares(order.rate_usd)}/USD
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

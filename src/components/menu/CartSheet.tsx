'use client';

import { useState } from 'react';
import { Bike, Building2, MapPin, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem, DeliveryZone, PickupType, UsdRateInfo } from '@/types/database';
import { buildOrderWhatsAppUrl, cn, formatPrice } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import { ModalShell } from '@/components/ui/ModalShell';
import { DualPrice } from '@/components/ui/DualPrice';
import { useCart } from './CartContext';
import { saveOrder } from '@/app/actions/orders';

interface CartSheetProps {
  rate: UsdRateInfo | null;
  deliveryZones: DeliveryZone[];
  onClose: () => void;
}

export function CartSheet({ rate, deliveryZones, onClose }: CartSheetProps) {
  const {
    items,
    total,
    incrementItem,
    decrementItem,
    setItemNote,
    removeItem,
    clearCart,
  } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [pickupType, setPickupType] = useState<PickupType>('tienda');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const whatsappReady = Boolean(siteConfig.whatsappNumber);

  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId);
  const deliveryCost = pickupType === 'delivery' && selectedZone ? selectedZone.cost : 0;
  const totalWithDelivery = total + deliveryCost;

  async function handleConfirm() {
    if (isSending) return;
    setIsSending(true);
    setSaveError(null);

    window.open(
      buildOrderWhatsAppUrl(items, customerName, rate, pickupType, selectedZone?.name, deliveryCost),
      '_blank',
      'noopener,noreferrer'
    );

    const sidesTotal = items.reduce(
      (sum, item) => sum + (item.sideDishes?.reduce((s, sd) => s + sd.price, 0) ?? 0) * item.quantity,
      0
    );
    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const grandTotal = itemsTotal + sidesTotal + deliveryCost;

    const result = await saveOrder({
      customer_name: customerName.trim() || null,
      items: items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note?.trim() || undefined,
        sideDishes: item.sideDishes ?? [],
      })),
      total_usd: grandTotal,
      total_bs: rate ? grandTotal * rate.rate : null,
      rate_usd: rate?.rate ?? null,
      pickup_type: pickupType,
      delivery_zone: selectedZone?.name ?? null,
      delivery_cost: deliveryCost,
    });

    if (!result.success) {
      setSaveError(result.error ?? 'No se pudo guardar la orden.');
      setIsSending(false);
      return;
    }

    clearCart();
    setIsSending(false);
    onClose();
  }

  return (
    <ModalShell onClose={onClose} label="Tu pedido">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="size-5 text-brand-primary" aria-hidden />
          <h2 className="font-heading text-lg font-bold text-brand-light">Tu pedido</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar pedido"
          className="rounded-full p-2 text-brand-light/40 transition-colors hover:bg-white/[0.07] hover:text-brand-light"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <ShoppingBag className="size-10 text-brand-light/15" aria-hidden />
          <p className="text-sm font-medium text-brand-light/50">
            Tu carrito está vacío. Agrega platos desde el menú.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 overflow-y-auto px-5 py-4 sm:px-6">
            {items.map((item) => (
              <li
                key={item.dishId}
                className="flex flex-col gap-2 rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-light">{item.name}</p>
                    <p className="mt-0.5 text-xs text-brand-light/45">
                      {formatPrice(item.price)} c/u
                    </p>
                  </div>
                  <DualPrice
                    amount={(item.price + (item.sideDishes?.reduce((s, sd) => s + sd.price, 0) ?? 0)) * item.quantity}
                    rate={rate}
                    className="shrink-0 font-heading text-sm font-bold text-brand-primary"
                  />
                </div>
                {item.sideDishes && item.sideDishes.length > 0 && (
                  <ul className="flex flex-col gap-1 rounded-lg bg-brand-primary/[0.06] px-3 py-2 ring-1 ring-brand-primary/10">
                    {item.sideDishes.map((side) => (
                      <li key={side.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-brand-light/70">+ {side.name}</span>
                        <span className="font-medium text-brand-primary/80">{formatPrice(side.price)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="flex shrink-0 items-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                    <button
                      type="button"
                      onClick={() => decrementItem(item.dishId)}
                      disabled={item.quantity <= 1}
                      aria-label={`Quitar una unidad de ${item.name}`}
                      className="flex size-8 items-center justify-center rounded-l-lg text-brand-light/70 transition-colors hover:bg-white/[0.08] hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-brand-light tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementItem(item.dishId)}
                      aria-label={`Agregar una unidad de ${item.name}`}
                      className="flex size-8 items-center justify-center rounded-r-lg text-brand-light/70 transition-colors hover:bg-white/[0.08] hover:text-brand-light"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.note ?? ''}
                    onChange={(e) => setItemNote(item.dishId, e.target.value)}
                    placeholder="Nota (ej: sin cebolla)"
                    maxLength={140}
                    aria-label={`Nota para ${item.name}`}
                    className="h-8 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 text-xs text-brand-light placeholder:text-brand-light/40 focus:border-brand-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.dishId)}
                    aria-label={`Eliminar ${item.name} del pedido`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-brand-light/40 transition-colors hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <footer className="flex shrink-0 flex-col gap-3.5 border-t border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6 sm:py-5">
            {/* Tipo de retiro */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPickupType('tienda')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ring-1 transition-all',
                  pickupType === 'tienda'
                    ? 'bg-brand-accent/15 ring-brand-accent/40 text-brand-primary'
                    : 'ring-white/[0.08] text-brand-light/50 hover:bg-white/[0.04]'
                )}
              >
                <Building2 className="size-4" aria-hidden />
                En Tienda
              </button>
              <button
                type="button"
                onClick={() => setPickupType('delivery')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ring-1 transition-all',
                  pickupType === 'delivery'
                    ? 'bg-brand-accent/15 ring-brand-accent/40 text-brand-primary'
                    : 'ring-white/[0.08] text-brand-light/50 hover:bg-white/[0.04]'
                )}
              >
                <Bike className="size-4" aria-hidden />
                Delivery
              </button>
            </div>

            {pickupType === 'delivery' && (
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-brand-light/40 uppercase">
                  <MapPin className="size-3" aria-hidden />
                  Zona de delivery
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 text-sm text-brand-light focus:border-brand-accent focus:outline-none"
                >
                  <option value="" className="bg-brand-dark text-brand-light">Seleccionar zona…</option>
                  {deliveryZones.map((z) => (
                    <option key={z.id} value={z.id} className="bg-brand-dark text-brand-light">
                      {z.name} — {formatPrice(z.cost)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tu nombre (opcional)"
              maxLength={60}
              aria-label="Nombre del cliente"
              className="h-10 w-full rounded-xl border border-white/20 bg-white/[0.07] px-3.5 text-sm text-brand-light placeholder:text-brand-light/45 focus:border-brand-accent focus:outline-none"
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-end justify-between gap-3">
                <span className="font-heading text-sm font-semibold tracking-wide text-brand-light/60 uppercase">
                  Total
                </span>
                <DualPrice
                  amount={totalWithDelivery}
                  rate={rate}
                  className="font-heading text-lg font-bold text-brand-primary"
                />
              </div>
              {pickupType === 'delivery' && deliveryCost > 0 && (
                <p className="text-right text-[11px] text-brand-light/35">
                  Incluye delivery {selectedZone?.name}: {formatPrice(deliveryCost)}
                </p>
              )}
            </div>
            {saveError && (
              <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 ring-1 ring-red-500/30">
                {saveError}
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!whatsappReady || isSending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent to-brand-primary font-heading font-bold text-brand-darker shadow-elevated transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageCircle className="size-5" aria-hidden />
              {isSending ? 'Enviando...' : 'Enviar pedido por WhatsApp'}
            </button>
            {!whatsappReady && (
              <p className="text-center text-xs text-brand-light/40">
                El número de WhatsApp del restaurante no está configurado.
              </p>
            )}
          </footer>
        </>
      )}
    </ModalShell>
  );
}

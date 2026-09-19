import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { siteConfig } from '@/config/site';
import type { CartItem, UsdRateInfo } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatBolivares(amount: number): string {
  return `Bs. ${new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatRateDate(isoDate: string): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export type PickupType = 'tienda' | 'delivery';

export function buildOrderWhatsAppUrl(
  items: CartItem[],
  customerName?: string,
  rate?: UsdRateInfo | null,
  pickupType?: PickupType
): string {
  const lines = [`*NUEVO PEDIDO — ${siteConfig.name}*`];
  const name = customerName?.trim();
  if (name) lines.push(`Cliente: ${name}`);
  if (pickupType) {
    lines.push(`Retiro: ${pickupType === 'tienda' ? ' En Tienda' : ' Delivery'}`);
  }

  lines.push('──────────────');
  let totalUsd = 0;
  for (const item of items) {
    const sidesTotal = item.sideDishes?.reduce((s, sd) => s + sd.price, 0) ?? 0;
    const subtotal = (item.price + sidesTotal) * item.quantity;
    totalUsd += subtotal;
    lines.push(
      `${item.quantity}x ${item.name} — ${formatPrice(subtotal)}${
        rate ? ` · ${formatBolivares(subtotal * rate.rate)}` : ''
      }`
    );
    if (item.sideDishes && item.sideDishes.length > 0) {
      for (const side of item.sideDishes) {
        lines.push(`   ↳ + ${side.name} (${formatPrice(side.price)})`);
      }
    }
    const note = item.note?.trim();
    if (note) lines.push(`   ↳ ${note}`);
  }
  lines.push('──────────────');
  lines.push(
    `*TOTAL: ${formatPrice(totalUsd)}${rate ? ` · ${formatBolivares(totalUsd * rate.rate)}` : ''}*`
  );

  if (rate) {
    const label =
      rate.source === 'bcv'
        ? 'BCV'
        : `BCV ${rate.adjustPercent > 0 ? '+' : ''}${rate.adjustPercent}%`;
    const dateLabel = rate.updatedAt ? formatRateDate(rate.updatedAt) : null;
    lines.push(
      `Tasa: ${formatBolivares(rate.rate)}/USD (${label}${dateLabel ? ` · ${dateLabel}` : ''})`
    );
  }

  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildWhatsAppUrl(dishName?: string): string {
  const text = encodeURIComponent(
    dishName
      ? `Hola, quisiera consultar sobre el plato: ${dishName}`
      : 'Hola, quisiera hacer un pedido.'
  );
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
}

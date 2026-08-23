import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { siteConfig } from '@/config/site';

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

export function buildWhatsAppUrl(dishName?: string): string {
  const text = encodeURIComponent(
    dishName
      ? `Hola, quisiera consultar sobre el plato: ${dishName}`
      : 'Hola, quisiera hacer un pedido.'
  );
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
}

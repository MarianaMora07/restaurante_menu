export const siteConfig = {
  name: process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? 'JOSWIL RESTAURANTE',
  tagline: 'Sabor artesanal en cada plato',
  description:
    'Carta digital con nuestros platos, promociones exclusivas y el Menú del Día.',
  address: process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS ?? '',
  hours: [
    { days: 'Lunes a Viernes', time: '11:00 – 22:00' },
    { days: 'Sábado y Domingo', time: '12:00 – 23:00' },
  ],
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
} as const;

import { z } from 'zod';

const httpsUrl = z
  .string()
  .url()
  .max(2048)
  .refine((u) => u.startsWith('https://'), 'Solo HTTPS');

export const DishPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid('Categoría inválida'),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).nullable(),
  ingredients: z.array(z.string().max(80)).max(30),
  price: z.number().finite().min(0).max(10_000),
  image_url: httpsUrl.nullable(),
  is_available: z.boolean(),
  is_daily_menu: z.boolean(),
  is_side_dish: z.boolean(),
  side_dish_group: z.string().max(60).nullable(),
});

export const CategoryPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  display_order: z.number().int().min(0).max(9999),
  parent_id: z.string().uuid().nullable(),
});

export const PromoPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().max(500).nullable(),
  image_url: httpsUrl,
  duration_seconds: z.number().int().min(3).max(30),
  display_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

const SideDishItemSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  price: z.number().finite().min(0),
});

export const SaveOrderSchema = z.object({
  client_token: z.string().uuid('Token de sesión inválido').optional(),
  customer_name: z.string().trim().max(60).nullable(),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        name: z.string().min(1).max(120),
        price: z.number().finite().min(0),
        quantity: z.number().int().min(1).max(50),
        note: z.string().max(140).optional(),
        sideDishes: z.array(SideDishItemSchema).max(10).optional(),
      })
    )
    .min(1)
    .max(50),
  pickup_type: z.enum(['tienda', 'delivery']),
  delivery_zone: z.string().max(80).nullable().optional(),
  delivery_reference: z.string().trim().max(120).nullable().optional(),
});

export const RateSettingsSchema = z.object({
  mode: z.enum(['bcv', 'custom']),
  adjustPercent: z.number().finite().min(-90).max(500),
});

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const ScheduleSchema = z.object({
  enabled: z.boolean(),
  days: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        isOpen: z.boolean(),
        open: z.string().regex(HHMM),
        close: z.string().regex(HHMM),
      })
    )
    .length(7)
    .refine(
      (days) => days.every((d) => !d.isOpen || d.open < d.close),
      'La hora de cierre debe ser posterior a la de apertura.'
    ),
});

export const DeliveryZonesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      name: z.string().trim().min(1).max(80),
      cost: z.number().finite().min(0).max(50),
    })
  )
  .min(1)
  .max(50);

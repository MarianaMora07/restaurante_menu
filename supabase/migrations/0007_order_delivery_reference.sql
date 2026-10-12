-- ============================================================================
-- Migración 0007: Agregar delivery_reference a órdenes (referencia/punto de
-- entrega del cliente para repartidores).
-- Ejecutar en Supabase SQL Editor. Idempotente.
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_reference text;

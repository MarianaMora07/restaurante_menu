-- ============================================================================
-- Migración 0006: Agregar status 'dispatched' para órdenes despachadas.
-- Ejecutar en Supabase SQL Editor. Idempotente.
-- ============================================================================

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
    CHECK (status in ('pending', 'paid', 'preparing', 'ready', 'dispatched'));

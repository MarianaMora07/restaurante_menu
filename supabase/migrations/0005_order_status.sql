-- ============================================================================
-- Migración 0005: Campo status para workflow de órdenes.
-- Ejecutar en Supabase SQL Editor. Idempotente.
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status text not null default 'pending'
    check (status in ('pending', 'paid', 'preparing', 'ready'));

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

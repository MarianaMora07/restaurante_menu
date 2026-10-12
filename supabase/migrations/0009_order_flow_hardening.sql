-- ============================================================================
-- Migración 0009: Endurecimiento del flujo de órdenes.
-- Ejecutar en Supabase SQL Editor. Idempotente.
-- =============================================================================

-- 1) Token de idempotencia: el cliente genera un UUID por intento de checkout;
--    un reintento (doble click, retry de red) reutiliza el mismo token y NO
--    crea una orden duplicada.
alter table public.orders
  add column if not exists client_token uuid;

create unique index if not exists idx_orders_client_token
  on public.orders(client_token)
  where client_token is not null;

-- 2) Número de orden legible (#0001, #0002…) secuencial, generado por Postgres.
alter table public.orders
  add column if not exists order_number bigint
  generated always as identity;

-- 3) Realtime: asegurar que orders esté en la publicación para que el panel
--    reciba INSERT/UPDATE en vivo.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

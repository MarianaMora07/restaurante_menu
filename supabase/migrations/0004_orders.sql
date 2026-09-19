-- ============================================================================
-- Migración 0004: Tabla de órdenes / historial de ventas.
-- Ejecutar en Supabase SQL Editor. Idempotente.
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  items jsonb not null default '[]'::jsonb,
  total_usd numeric(10,2) not null default 0,
  total_bs numeric(12,2),
  rate_usd numeric(10,4),
  pickup_type text not null default 'tienda'
    check (pickup_type in ('tienda', 'delivery')),
  delivery_zone text,
  delivery_cost numeric(10,2) default 0,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Staff gestiona órdenes" on public.orders;
create policy "Staff gestiona órdenes"
  on public.orders
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated insert orders" on public.orders;
create policy "Authenticated insert orders"
  on public.orders
  for insert
  to authenticated
  with check (true);

drop policy if exists "Anon insert orders" on public.orders;
create policy "Anon insert orders"
  on public.orders
  for insert
  to anon
  with check (true);

create index if not exists idx_orders_created_at
  on public.orders(created_at desc);

create index if not exists idx_orders_pickup_type
  on public.orders(pickup_type);

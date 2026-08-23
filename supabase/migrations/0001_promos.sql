-- ============================================================================
-- Migración: sistema de promociones / flyers del carrusel de la landing.
--
-- Cómo ejecutarla: pega este script completo en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/_/sql) y ejecútalo una sola vez.
-- Es idempotente: puede re-ejecutarse sin duplicar objetos.
-- ============================================================================

-- 1) Tabla de promociones ----------------------------------------------------
create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  duration_seconds integer not null default 6
    check (duration_seconds between 3 and 30),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promos enable row level security;

drop policy if exists "Public read active promos" on public.promos;
create policy "Public read active promos"
  on public.promos for select
  using (is_active = true);

drop policy if exists "Authenticated manage promos" on public.promos;
create policy "Authenticated manage promos"
  on public.promos for all to authenticated
  using (true)
  with check (true);

-- 2) Bucket de Storage para las imágenes de promos ---------------------------
insert into storage.buckets (id, name, public)
values ('promos-images', 'promos-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read promo images" on storage.objects;
create policy "Public read promo images"
  on storage.objects for select
  using (bucket_id = 'promos-images');

drop policy if exists "Authenticated manage promo images" on storage.objects;
create policy "Authenticated manage promo images"
  on storage.objects for all to authenticated
  using (bucket_id = 'promos-images')
  with check (bucket_id = 'promos-images');

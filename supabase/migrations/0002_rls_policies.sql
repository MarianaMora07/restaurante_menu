-- =============================================================
-- 0002: Políticas RLS para categorías y platos + buckets faltantes
-- Ejecutar en Supabase SQL Editor.
--
-- Síntoma que corrige: tablas con RLS habilitado pero SIN política
-- de SELECT público => el cliente (anon) recibe arrays vacíos y
-- la nueva categoría nunca aparece en el formulario del panel.
-- =============================================================

-- ---------- CATEGORÍAS ----------
alter table public.categories enable row level security;

drop policy if exists "Categorías visibles para todos" on public.categories;
create policy "Categorías visibles para todos"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Staff gestiona categorías" on public.categories;
create policy "Staff gestiona categorías"
  on public.categories
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------- PLATOS ----------
alter table public.dishes enable row level security;

drop policy if exists "Platos visibles para todos" on public.dishes;
create policy "Platos visibles para todos"
  on public.dishes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Staff gestiona platos" on public.dishes;
create policy "Staff gestiona platos"
  on public.dishes
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------- STORAGE: bucket de imágenes de platos ----------
insert into storage.buckets (id, name, public)
values ('dishes-images', 'dishes-images', true)
on conflict (id) do nothing;

drop policy if exists "Imágenes de platos accesibles públicamente" on storage.objects;
create policy "Imágenes de platos accesibles públicamente"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'dishes-images');

drop policy if exists "Staff sube imágenes de platos" on storage.objects;
create policy "Staff sube imágenes de platos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'dishes-images');

drop policy if exists "Staff actualiza imágenes de platos" on storage.objects;
create policy "Staff actualiza imágenes de platos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'dishes-images');

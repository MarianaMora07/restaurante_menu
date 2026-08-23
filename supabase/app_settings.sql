-- Tabla de configuración global editable desde el panel de administración.
-- Ejecutar una sola vez en el SQL Editor de Supabase.

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Lectura pública de ajustes"
  on public.app_settings
  for select
  to anon, authenticated
  using (true);

create policy "Inserción para autenticados"
  on public.app_settings
  for insert
  to authenticated
  with check (true);

create policy "Actualización para autenticados"
  on public.app_settings
  for update
  to authenticated
  using (true)
  with check (true);

insert into public.app_settings (key, value)
values
  ('usd_rate_mode', 'bcv'),
  ('usd_rate_adjust_percent', '0')
on conflict (key) do nothing;

-- Migración 0010: Bucket para plantillas del menú del día.
-- Ejecutar en Supabase SQL Editor. Idempotente.

-- 1) Bucket público para plantillas PNG/PDF del menú
insert into storage.buckets (id, name, public)
values ('menu-templates', 'menu-templates', true)
on conflict (id) do nothing;

-- 2) Policies de Storage para el bucket de plantillas
drop policy if exists "Admin sube plantillas" on storage.objects;
create policy "Admin sube plantillas"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-templates' and public.is_admin());

drop policy if exists "Admin actualiza plantillas" on storage.objects;
create policy "Admin actualiza plantillas"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-templates' and public.is_admin());

drop policy if exists "Admin elimina plantillas" on storage.objects;
create policy "Admin elimina plantillas"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-templates' and public.is_admin());

drop policy if exists "Lectura pública plantillas" on storage.objects;
create policy "Lectura pública plantillas"
  on storage.objects for select
  using (bucket_id = 'menu-templates');

-- 3) Key en app_settings para la URL de la plantilla activa
insert into public.app_settings (key, value)
values ('menu_template_url', '')
on conflict (key) do nothing;

-- ============================================================================
-- Migración 0008: Endurecimiento de RLS.
-- Ejecutar en Supabase SQL Editor. Idempotente.
-- AJUSTA: reemplaza admin1@ejemplo.com / admin2@ejemplo.com por los correos
-- reales de Supabase Auth antes de ejecutar.
-- =============================================================================

-- 1) El alta de órdenes va SOLO vía service_role (saveOrder). Eliminar el
--    insert anónimo residual que permitía escribir directo por PostgREST.
drop policy if exists "Anon insert orders" on public.orders;

drop policy if exists "Authenticated insert orders" on public.orders;
create policy "Authenticated insert orders"
  on public.orders
  for insert
  to authenticated
  with check (true);

-- 2) Helper centralizado: lista blanca de administradores.
--    Para agregar/quitar un admin en el futuro:
--    update or replace is solo la lista de este bloque y re-ejecutarlo.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') in (
    'admin1@ejemplo.com',
    'admin2@ejemplo.com'
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

-- 3) Staff: restringir escritura a is_admin().
do $$
begin
  drop policy if exists "Staff gestiona categorías" on public.categories;
  create policy "Staff gestiona categorías"
    on public.categories for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

  drop policy if exists "Staff gestiona platos" on public.dishes;
  create policy "Staff gestiona platos"
    on public.dishes for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

  drop policy if exists "Authenticated manage promos" on public.promos;
  create policy "Authenticated manage promos"
    on public.promos for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

  drop policy if exists "Staff gestiona órdenes" on public.orders;
  create policy "Staff gestiona órdenes"
    on public.orders for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

  drop policy if exists "Inserción para autenticados" on public.app_settings;
  create policy "Inserción para autenticados"
    on public.app_settings for insert to authenticated
    with check (public.is_admin());

  drop policy if exists "Actualización para autenticados" on public.app_settings;
  create policy "Actualización para autenticados"
    on public.app_settings for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());

  drop policy if exists "Staff sube imágenes de platos" on storage.objects;
  create policy "Staff sube imágenes de platos"
    on storage.objects for insert to authenticated
    with check (bucket_id in ('dishes-images', 'promos-images')
      and public.is_admin());

  drop policy if exists "Staff actualiza imágenes de platos" on storage.objects;
  create policy "Staff actualiza imágenes de platos"
    on storage.objects for update to authenticated
    using (bucket_id in ('dishes-images', 'promos-images')
      and public.is_admin());

  drop policy if exists "Staff elimina imágenes de platos" on storage.objects;
  create policy "Staff elimina imágenes de platos"
    on storage.objects for delete to authenticated
    using (bucket_id in ('dishes-images', 'promos-images')
      and public.is_admin());

  drop policy if exists "Authenticated manage promo images" on storage.objects;
  create policy "Authenticated manage promo images"
    on storage.objects for all to authenticated
    using (bucket_id = 'promos-images'
      and public.is_admin())
    with check (bucket_id = 'promos-images'
      and public.is_admin());
end $$;

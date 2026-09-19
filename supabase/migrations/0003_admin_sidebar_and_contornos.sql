-- ============================================================================
-- Migración 0003: Sidebar admin + sistema de contornos + subcategorías.
--
-- Cómo ejecutarla: pega este script completo en el SQL Editor de Supabase
-- y ejecútalo una sola vez. Es idempotente.
-- ============================================================================

-- 1) Subcategorías: columna parent_id en categories -------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'categories' and column_name = 'parent_id'
  ) then
    alter table public.categories
      add column parent_id uuid references public.categories(id) on delete set null;

    create index if not exists idx_categories_parent_id
      on public.categories(parent_id);
  end if;
end $$;

-- 2) Contornos: columnas is_side_dish y side_dish_group en dishes ------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dishes' and column_name = 'is_side_dish'
  ) then
    alter table public.dishes
      add column is_side_dish boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dishes' and column_name = 'side_dish_group'
  ) then
    alter table public.dishes
      add column side_dish_group text;
  end if;
end $$;

create index if not exists idx_dishes_is_side_dish
  on public.dishes(is_side_dish) where is_side_dish = true;

create index if not exists idx_dishes_side_dish_group
  on public.dishes(side_dish_group) where side_dish_group is not null;

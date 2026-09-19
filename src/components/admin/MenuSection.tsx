'use client';

import { useMemo, useState } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import type { Category, Dish, UsdRateInfo } from '@/types/database';
import { toggleDailyMenu, toggleDishAvailability } from '@/app/actions/dishes';
import { DishRow } from './DishRow';
import { DishFormModal } from './DishFormModal';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';

interface MenuSectionProps {
  categories: Category[];
  dishes: Dish[];
  rate: UsdRateInfo | null;
  isPending: boolean;
  onToggleAvailability: (dishId: string, value: boolean) => void;
  onToggleDailyMenu: (dishId: string, value: boolean) => void;
}

interface Section {
  title: string;
  items: Dish[];
}

export function MenuSection({
  categories,
  dishes,
  rate,
  isPending,
  onToggleAvailability,
  onToggleDailyMenu,
}: MenuSectionProps) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = dishes;
    if (categoryId) result = result.filter((d) => d.category_id === categoryId);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.ingredients.some((i) => i.toLowerCase().includes(q))
      );
    }
    return result;
  }, [dishes, categoryId, search]);

  const sections = useMemo<Section[]>(() => {
    const grouped = categories
      .map((cat) => ({
        title: cat.name,
        items: filtered.filter((d) => d.category_id === cat.id),
      }))
      .filter((s) => s.items.length > 0);
    const knownIds = new Set(categories.map((c) => c.id));
    const orphans = filtered.filter((d) => !knownIds.has(d.category_id));
    if (orphans.length > 0) grouped.push({ title: 'Sin categoría', items: orphans });
    return grouped;
  }, [categories, filtered]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar plato..."
          className="flex-1 sm:max-w-xs"
        />
        <CategoryFilter
          categories={categories}
          selectedId={categoryId}
          onChange={setCategoryId}
          className="sm:w-44"
        />
        <button
          type="button"
          onClick={() => { setEditingDish(null); setIsFormOpen(true); }}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-accent px-4 text-xs font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95"
        >
          <Plus className="size-4" aria-hidden />
          Nuevo plato
        </button>
      </div>

      {/* List */}
      {sections.length > 0 ? (
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.16em] text-brand-light/35 uppercase">
                {section.title}
              </h3>
              <div className="flex flex-col gap-2.5">
                {section.items.map((dish) => (
                  <DishRow
                    key={dish.id}
                    dish={dish}
                    rate={rate}
                    isPending={isPending}
                    onToggleAvailability={(v) => onToggleAvailability(dish.id, v)}
                    onToggleDailyMenu={(v) => onToggleDailyMenu(dish.id, v)}
                    onEdit={setEditingDish}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          hasFilters={!!search || !!categoryId}
          onClear={() => { setSearch(''); setCategoryId(null); }}
          onCreate={() => { setEditingDish(null); setIsFormOpen(true); }}
        />
      )}

      {isFormOpen && (
        <DishFormModal
          dish={editingDish}
          categories={categories}
          onClose={() => { setIsFormOpen(false); setEditingDish(null); }}
        />
      )}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
  onCreate,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <UtensilsCrossed className="size-10 text-brand-light/12" aria-hidden />
      <p className="text-sm font-medium text-brand-light/45">
        {hasFilters ? 'No se encontraron platos con esos filtros.' : 'Aún no hay platos en el menú.'}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="h-10 rounded-xl bg-white/[0.07] px-5 text-sm font-semibold text-brand-light/70 transition-colors hover:bg-white/[0.12]"
        >
          Limpiar filtros
        </button>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          className="h-10 rounded-xl bg-brand-accent px-5 text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95"
        >
          Crear el primer plato
        </button>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Plus, Salad } from 'lucide-react';
import type { Category, Dish, UsdRateInfo } from '@/types/database';
import { toggleDailyMenu, toggleDishAvailability } from '@/app/actions/dishes';
import { DishRow } from './DishRow';
import { ContornoFormModal } from './ContornoFormModal';
import { SearchBar } from './SearchBar';

interface ContornosSectionProps {
  categories: Category[];
  dishes: Dish[];
  rate: UsdRateInfo | null;
  isPending: boolean;
  onToggleAvailability: (dishId: string, value: boolean) => void;
  onToggleDailyMenu: (dishId: string, value: boolean) => void;
}

interface SideGroup {
  title: string;
  items: Dish[];
}

export function ContornosSection({
  categories,
  dishes,
  rate,
  isPending,
  onToggleAvailability,
  onToggleDailyMenu,
}: ContornosSectionProps) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Dish | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sideDishes = useMemo(() => dishes.filter((d) => d.is_side_dish), [dishes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sideDishes;
    const q = search.toLowerCase();
    return sideDishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.side_dish_group?.toLowerCase().includes(q)
    );
  }, [sideDishes, search]);

  const groups = useMemo<SideGroup[]>(() => {
    const grouped = new Map<string, Dish[]>();
    for (const dish of filtered) {
      const key = dish.side_dish_group || 'Sin grupo';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(dish);
    }
    return Array.from(grouped.entries()).map(([title, items]) => ({ title, items }));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar contorno..."
          className="flex-1 sm:max-w-xs"
        />
        <button
          type="button"
          onClick={() => { setEditing(null); setIsFormOpen(true); }}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-accent px-4 text-xs font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95"
        >
          <Plus className="size-4" aria-hidden />
          Nuevo contorno
        </button>
      </div>

      {groups.length > 0 ? (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.16em] text-brand-light/35 uppercase">
                {group.title}
              </h3>
              <div className="flex flex-col gap-2.5">
                {group.items.map((dish) => (
                  <DishRow
                    key={dish.id}
                    dish={dish}
                    rate={rate}
                    isPending={isPending}
                    onToggleAvailability={(v) => onToggleAvailability(dish.id, v)}
                    onToggleDailyMenu={(v) => onToggleDailyMenu(dish.id, v)}
                    onEdit={setEditing}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <Salad className="size-10 text-brand-light/12" aria-hidden />
          <p className="text-sm font-medium text-brand-light/45">
            {search ? 'No se encontraron contornos.' : 'Aún no hay contornos registrados.'}
          </p>
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="h-10 rounded-xl bg-white/[0.07] px-5 text-sm font-semibold text-brand-light/70 transition-colors hover:bg-white/[0.12]"
            >
              Limpiar búsqueda
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setEditing(null); setIsFormOpen(true); }}
              className="h-10 rounded-xl bg-brand-accent px-5 text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95"
            >
              Crear el primer contorno
            </button>
          )}
        </div>
      )}

      {isFormOpen && (
        <ContornoFormModal
          dish={editing}
          categories={categories}
          onClose={() => { setIsFormOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

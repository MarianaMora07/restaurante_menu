'use client';

import { useMemo, useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Megaphone, Plus, UtensilsCrossed, X } from 'lucide-react';
import type { Category, Dish, Promo } from '@/types/database';
import { siteConfig } from '@/config/site';
import { createClient } from '@/lib/supabase/client';
import {
  toggleDailyMenu,
  toggleDishAvailability,
} from '@/app/actions/dishes';
import { togglePromoActive } from '@/app/actions/promos';
import { DishRow } from './DishRow';
import { DishFormModal } from './DishFormModal';
import { PromoRow } from './PromoRow';
import { PromoFormModal } from './PromoFormModal';

interface DashboardViewProps {
  categories: Category[];
  dishes: Dish[];
  promos: Promo[];
}

interface Section {
  title: string;
  items: Dish[];
}

type FlagUpdate = {
  id: string;
  field: 'is_available' | 'is_daily_menu';
  value: boolean;
};

type PromoFlagUpdate = {
  id: string;
  value: boolean;
};

export function DashboardView({ categories, dishes, promos }: DashboardViewProps) {
  const router = useRouter();
  const [optimisticDishes, applyOptimistic] = useOptimistic(
    dishes,
    (state, update: FlagUpdate) =>
      state.map((dish) =>
        dish.id === update.id ? { ...dish, [update.field]: update.value } : dish
      )
  );
  const [optimisticPromos, applyPromoOptimistic] = useOptimistic(
    promos,
    (state, update: PromoFlagUpdate) =>
      state.map((promo) =>
        promo.id === update.id ? { ...promo, is_active: update.value } : promo
      )
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isDishFormOpen, setIsDishFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [isPromoFormOpen, setIsPromoFormOpen] = useState(false);

  const sections = useMemo<Section[]>(() => {
    const grouped = categories.map((category) => ({
      title: category.name,
      items: optimisticDishes.filter((dish) => dish.category_id === category.id),
    }));
    const knownIds = new Set(categories.map((category) => category.id));
    const orphans = optimisticDishes.filter((dish) => !knownIds.has(dish.category_id));
    if (orphans.length > 0) grouped.push({ title: 'Sin categoría', items: orphans });
    return grouped.filter((section) => section.items.length > 0);
  }, [categories, optimisticDishes]);

  function handleToggle(update: FlagUpdate, action: typeof toggleDishAvailability) {
    setError(null);
    startTransition(async () => {
      applyOptimistic(update);
      const result = await action(update.id, update.value);
      if (!result.success) {
        setError(result.error ?? 'No se pudo actualizar el plato.');
      }
    });
  }

  function handleTogglePromo(update: PromoFlagUpdate) {
    setError(null);
    startTransition(async () => {
      applyPromoOptimistic(update);
      const result = await togglePromoActive(update.id, update.value);
      if (!result.success) {
        setError(result.error ?? 'No se pudo actualizar la promoción.');
      }
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  function openCreateDish() {
    setEditingDish(null);
    setIsDishFormOpen(true);
  }

  function openEditDish(dish: Dish) {
    setEditingDish(dish);
    setIsDishFormOpen(true);
  }

  function closeDishForm() {
    setIsDishFormOpen(false);
    setEditingDish(null);
  }

  function openCreatePromo() {
    setEditingPromo(null);
    setIsPromoFormOpen(true);
  }

  function openEditPromo(promo: Promo) {
    setEditingPromo(promo);
    setIsPromoFormOpen(true);
  }

  function closePromoForm() {
    setIsPromoFormOpen(false);
    setEditingPromo(null);
  }

  return (
    <div className="min-h-dvh bg-brand-darker">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-brand-darker/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="font-display text-lg font-bold tracking-tight text-brand-light">
            {siteConfig.name}
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="flex size-10 items-center justify-center rounded-xl text-brand-light/50 ring-1 ring-white/10 transition-colors hover:bg-white/[0.07] hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-16">
        <section aria-label="Platos">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-heading text-sm font-bold tracking-[0.16em] text-brand-light/50 uppercase">
              Platos
            </h2>
            <button
              type="button"
              onClick={openCreateDish}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-accent px-3.5 text-xs font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo plato
            </button>
          </div>

          {sections.length > 0 ? (
            <div className="flex flex-col gap-8">
              {sections.map((section) => (
                <div key={section.title} aria-label={section.title}>
                  <h3 className="mb-3 text-xs font-semibold tracking-wider text-brand-light/40 uppercase">
                    {section.title}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {section.items.map((dish) => (
                      <DishRow
                        key={dish.id}
                        dish={dish}
                        isPending={isPending}
                        onToggleAvailability={(value) =>
                          handleToggle(
                            { id: dish.id, field: 'is_available', value },
                            toggleDishAvailability
                          )
                        }
                        onToggleDailyMenu={(value) =>
                          handleToggle(
                            { id: dish.id, field: 'is_daily_menu', value },
                            toggleDailyMenu
                          )
                        }
                        onEdit={openEditDish}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <UtensilsCrossed
                className="size-10 text-brand-light/15"
                aria-hidden
              />
              <p className="text-sm font-medium text-brand-light/50">
                Aún no hay platos en el menú.
              </p>
              <button
                type="button"
                onClick={openCreateDish}
                className="h-11 rounded-xl bg-brand-accent px-6 text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95"
              >
                Crear el primer plato
              </button>
            </div>
          )}
        </section>

        <section aria-label="Promociones" className="mt-12">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-heading text-sm font-bold tracking-[0.16em] text-brand-light/50 uppercase">
              Promociones
            </h2>
            <button
              type="button"
              onClick={openCreatePromo}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-accent px-3.5 text-xs font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <Plus className="size-4" aria-hidden />
              Nueva promoción
            </button>
          </div>

          {optimisticPromos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {optimisticPromos.map((promo) => (
                <PromoRow
                  key={promo.id}
                  promo={promo}
                  isPending={isPending}
                  onToggleActive={(value) =>
                    handleTogglePromo({ id: promo.id, value })
                  }
                  onEdit={openEditPromo}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-10 text-center">
              <Megaphone className="size-8 text-brand-light/20" aria-hidden />
              <p className="max-w-sm text-sm font-medium text-brand-light/50">
                Aún no hay promociones. Crea flyers que se mostrarán en el carrusel de la página principal.
              </p>
            </div>
          )}
        </section>
      </main>

      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Descartar error"
            className="shrink-0 rounded-full p-1 transition-colors hover:bg-red-500"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {isDishFormOpen && (
        <DishFormModal dish={editingDish} categories={categories} onClose={closeDishForm} />
      )}
      {isPromoFormOpen && (
        <PromoFormModal promo={editingPromo} onClose={closePromoForm} />
      )}
    </div>
  );
}

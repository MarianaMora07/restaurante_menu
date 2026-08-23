'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import type { Category, Dish, Promo } from '@/types/database';
import { siteConfig } from '@/config/site';
import { CategoryTabs } from './CategoryTabs';
import { DishCard } from './DishCard';
import { DishModal } from './DishModal';

interface MenuViewProps {
  categories: Category[];
  dishes: Dish[];
  promos?: Promo[];
  onBack?: () => void;
}

interface DishGroup {
  id: string;
  name: string;
  dishes: Dish[];
}

export function MenuView({ categories, dishes, promos = [], onBack }: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const groups = useMemo<DishGroup[]>(() => {
    if (activeCategory === 'daily') {
      return [
        {
          id: 'daily',
          name: 'Menú del Día',
          dishes: dishes.filter((dish) => dish.is_daily_menu),
        },
      ];
    }
    if (activeCategory !== 'all') {
      const category = categories.find((c) => c.slug === activeCategory);
      return category
        ? [
            {
              id: category.id,
              name: category.name,
              dishes: dishes.filter((dish) => dish.category_id === category.id),
            },
          ]
        : [];
    }
    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        dishes: dishes.filter((dish) => dish.category_id === category.id),
      }))
      .filter((group) => group.dishes.length > 0);
  }, [activeCategory, categories, dishes]);

  const visiblePromos = promos.slice(0, 8);

  return (
    <div className="flex min-h-dvh flex-col bg-brand-darker">
      {/* Encabezado unificado: botón de retorno + tabs siempre visibles */}
      <header className="sticky top-0 z-40 bg-brand-darker/90 shadow-elevated backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-2 sm:px-6 sm:pt-2.5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-full py-1.5 pr-3 pl-2.5 font-heading text-[13px] font-semibold text-brand-light ring-1 ring-white/15 transition-all hover:bg-white/[0.07] hover:text-brand-primary hover:ring-brand-primary/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:gap-2 sm:py-2 sm:pr-4 sm:pl-3 sm:text-sm"
            >
              <ArrowLeft className="size-3.5 sm:size-4" aria-hidden />
              Volver al Inicio
            </button>
          ) : (
            <span />
          )}
          <span className="hidden max-w-[38vw] truncate font-display text-sm font-bold tracking-tight text-brand-light/80 min-[380px]:block sm:text-base">
            {siteConfig.name}
          </span>
        </div>
        <div aria-hidden className="h-1 sm:h-1.5" />
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </header>

      <main
        id="menu"
        className="mx-auto w-full max-w-5xl scroll-mt-28 flex-1 px-4 pt-6 pb-20 sm:px-6 sm:pt-8"
      >
        {visiblePromos.length > 0 && (
          <section
            aria-label="Promociones vigentes"
            className="mb-10 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-bold text-brand-light">
                Promociones
              </h2>
              <span
                aria-hidden
                className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-brand-primary/50 to-transparent"
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visiblePromos.map((promo) => (
                <article
                  key={promo.id}
                  className="group relative aspect-video w-56 shrink-0 overflow-hidden rounded-xl ring-1 ring-brand-primary/25 shadow-elevated sm:w-64"
                >
                  <Image
                    src={promo.image_url}
                    alt={promo.title}
                    fill
                    sizes="256px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#260101]/85 via-transparent to-transparent"
                  />
                  <p className="absolute inset-x-3 bottom-2.5 truncate font-heading text-xs font-bold text-brand-light drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] sm:text-sm">
                    {promo.title}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {groups.length > 0 ? (
          <div className="flex flex-col gap-12">
            {groups.map((group) => (
              <motion.section
                key={`${activeCategory}-${group.id}`}
                aria-label={group.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold text-brand-light sm:text-3xl">
                    {group.name}
                  </h2>
                  <span aria-hidden className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-brand-primary/50 to-transparent" />
                  <span className="font-heading text-xs font-semibold text-brand-light/35">
                    {group.dishes.length}{' '}
                    {group.dishes.length === 1 ? 'plato' : 'platos'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {group.dishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} onOpen={setSelectedDish} />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/8">
              <UtensilsCrossed className="size-7 text-brand-light/25" aria-hidden />
            </span>
            <p className="text-sm font-medium text-brand-light/50">
              No hay platos disponibles en esta categoría.
            </p>
          </div>
        )}
      </main>

      <DishModal dish={selectedDish} onClose={() => setSelectedDish(null)} />
    </div>
  );
}

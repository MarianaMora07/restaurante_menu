'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { UtensilsCrossed } from 'lucide-react';
import type { Category, Dish } from '@/types/database';
import { CategoryTabs } from './CategoryTabs';
import { DishCard } from './DishCard';
import { DishModal } from './DishModal';

interface MenuViewProps {
  categories: Category[];
  dishes: Dish[];
}

interface DishGroup {
  id: string;
  name: string;
  dishes: Dish[];
}

export function MenuView({ categories, dishes }: MenuViewProps) {
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

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />
      <main
        id="menu"
        className="mx-auto w-full max-w-5xl scroll-mt-28 flex-1 px-4 pt-10 pb-20 sm:px-6"
      >
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
    </>
  );
}

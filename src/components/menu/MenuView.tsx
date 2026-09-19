'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import type { Category, Dish, Promo, UsdRateInfo } from '@/types/database';
import { siteConfig } from '@/config/site';
import { formatPrice } from '@/lib/utils';
import { CategoryTabs } from './CategoryTabs';
import { DishCard } from './DishCard';
import { DishModal } from './DishModal';
import { SideDishModal } from './SideDishModal';
import { PromoCarousel } from './PromoCarousel';
import { PromoModal } from './PromoModal';
import { CartSheet } from './CartSheet';
import { CartProvider, useCart } from './CartContext';

interface MenuViewProps {
  categories: Category[];
  dishes: Dish[];
  promos?: Promo[];
  rate?: UsdRateInfo | null;
  onBack?: () => void;
}

interface DishGroup {
  id: string;
  name: string;
  dishes: Dish[];
}

export function MenuView(props: MenuViewProps) {
  return (
    <CartProvider>
      <MenuViewContent {...props} />
    </CartProvider>
  );
}

function MenuViewContent({
  categories,
  dishes,
  promos = [],
  rate = null,
  onBack,
}: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(() =>
    dishes.some((dish) => dish.is_daily_menu) ? 'daily' : 'all'
  );
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sideDishTarget, setSideDishTarget] = useState<Dish | null>(null);
  const { count, total, addDishWithSides } = useCart();

  const availableSides = useMemo(
    () => dishes.filter((d) => d.is_side_dish && d.is_available),
    [dishes]
  );

  const dailySides = useMemo(
    () => dishes.filter((d) => d.is_side_dish && d.is_daily_menu && d.is_available),
    [dishes]
  );

  const hasSideDishes = availableSides.length > 0;

  const groups = useMemo<DishGroup[]>(() => {
    if (activeCategory === 'daily') {
      const mainDishes = dishes.filter((d) => d.is_daily_menu && !d.is_side_dish);
      const sideDishes = dailySides;
      const result: DishGroup[] = [];
      if (mainDishes.length > 0) result.push({ id: 'daily-main', name: 'Platos Principales', dishes: mainDishes });
      if (sideDishes.length > 0) result.push({ id: 'daily-sides', name: 'Contornos del Día', dishes: sideDishes });
      return result;
    }
    if (activeCategory === 'contornos') {
      return [
        {
          id: 'contornos',
          name: 'Contornos',
          dishes: availableSides,
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
              dishes: dishes.filter(
                (dish) => dish.category_id === category.id && !dish.is_side_dish
              ),
            },
          ]
        : [];
    }
    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        dishes: dishes.filter(
          (dish) => dish.category_id === category.id && !dish.is_side_dish
        ),
      }))
      .filter((group) => group.dishes.length > 0);
  }, [activeCategory, categories, dishes, availableSides]);

  const visiblePromos = useMemo(
    () => promos.filter((p) => p.is_active).slice(0, 8),
    [promos]
  );

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
          hasSideDishes={hasSideDishes}
        />
      </header>

      <main
        id="menu"
        className="mx-auto w-full max-w-5xl scroll-mt-28 flex-1 px-4 pt-6 pb-24 sm:px-6 sm:pt-8"
      >
        {visiblePromos.length > 0 && (
          <section aria-label="Promociones vigentes" className="mb-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-bold text-brand-light">Promociones</h2>
              <span
                aria-hidden
                className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-brand-primary/50 to-transparent"
              />
            </div>
            <PromoCarousel promos={visiblePromos} onSelect={setSelectedPromo} />
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
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      rate={rate}
                      onOpen={setSelectedDish}
                      onRequestAdd={(d) => {
                        if (availableSides.length > 0 && !d.is_side_dish) setSideDishTarget(d);
                        else addDishWithSides(d, []);
                      }}
                    />
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

      {count > 0 && !isCartOpen && (
        <motion.button
          key={count}
          type="button"
          onClick={() => setIsCartOpen(true)}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="fixed right-4 bottom-5 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-accent to-brand-primary py-2.5 pr-5 pl-4 font-heading text-sm font-bold text-brand-darker shadow-glow-accent transition-transform hover:scale-[1.04] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-darker"
        >
          <ShoppingBag className="size-5" aria-hidden />
          <span className="flex flex-col leading-none">
            <span>
              {count} {count === 1 ? 'plato' : 'platos'}
            </span>
            <span className="mt-1 text-[11px] font-semibold opacity-80">{formatPrice(total)}</span>
          </span>
        </motion.button>
      )}

      <DishModal
        dish={selectedDish}
        rate={rate}
        onClose={() => setSelectedDish(null)}
        onRequestAdd={(d) => {
          if (availableSides.length > 0 && !d.is_side_dish) {
            setSelectedDish(null);
            setSideDishTarget(d);
          } else {
            addDishWithSides(d, []);
            setSelectedDish(null);
          }
        }}
      />
      <PromoModal promo={selectedPromo} onClose={() => setSelectedPromo(null)} />
      {isCartOpen && <CartSheet rate={rate} onClose={() => setIsCartOpen(false)} />}
      {sideDishTarget && (
        <SideDishModal
          dish={sideDishTarget}
          availableSides={availableSides}
          onConfirm={(sides) => {
            addDishWithSides(sideDishTarget, sides);
            setSideDishTarget(null);
          }}
          onSkip={() => {
            addDishWithSides(sideDishTarget, []);
            setSideDishTarget(null);
          }}
        />
      )}
    </div>
  );
}

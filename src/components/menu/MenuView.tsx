'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import type { Category, DeliveryZone, Dish, Promo, RestaurantSchedule, UsdRateInfo } from '@/types/database';
import { siteConfig } from '@/config/site';
import { formatPrice } from '@/lib/utils';
import { CategoryTabs } from './CategoryTabs';
import { DishCard } from './DishCard';
import { DishModal } from './DishModal';
import { SideDishModal } from './SideDishModal';
import { MenuFooter } from './MenuFooter';
import { PromoCarousel } from './PromoCarousel';
import { PromoModal } from './PromoModal';
import { CartSheet } from './CartSheet';
import { CartProvider, useCart } from './CartContext';

interface MenuViewProps {
  categories: Category[];
  dishes: Dish[];
  promos?: Promo[];
  deliveryZones?: DeliveryZone[];
  rate?: UsdRateInfo | null;
  schedule?: RestaurantSchedule | null;
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
  deliveryZones = [],
  rate = null,
  schedule = null,
  onBack,
}: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(() =>
    dishes.some((dish) => dish.is_daily_menu) ? 'daily' : 'all'
  );
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sideDishTarget, setSideDishTarget] = useState<Dish | null>(null);
  const { count, total, addDishWithSides, lastAddEvent } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (lastAddEvent === 0) return;
    // setTimeout(0) mantiene el setState fuera del cuerpo síncrono del effect.
    const show = setTimeout(() => setJustAdded(true), 0);
    const hide = setTimeout(() => setJustAdded(false), 1600);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [lastAddEvent]);

  const availableSides = useMemo(
    () => dishes.filter((d) => d.is_side_dish && d.is_available),
    [dishes]
  );

  const dailySides = useMemo(
    () => dishes.filter((d) => d.is_side_dish && d.is_daily_menu && d.is_available),
    [dishes]
  );

  const EXCLUDED_SIDE_CATEGORIES = ['bebidas', 'postres'];

  const dishCategoryName = (dish: Dish) =>
    categories.find((c) => c.id === dish.category_id)?.name?.toLowerCase() ?? '';

  const canHaveSides = (dish: Dish) =>
    !dish.is_side_dish && !EXCLUDED_SIDE_CATEGORIES.includes(dishCategoryName(dish));

  const groups = useMemo<DishGroup[]>(() => {
    if (activeCategory === 'daily') {
      const mainDishes = dishes.filter((d) => d.is_daily_menu && !d.is_side_dish);
      const sideDishes = dailySides;
      const result: DishGroup[] = [];

      const grouped = new Map<string, { name: string; dishes: Dish[] }>();
      for (const dish of mainDishes) {
        const cat = categories.find((c) => c.id === dish.category_id);
        const key = cat?.id ?? 'other';
        const entry = grouped.get(key) ?? { name: cat?.name ?? 'Otros', dishes: [] };
        entry.dishes.push(dish);
        grouped.set(key, entry);
      }
      const categoryOrder = ['contornos', 'bebidas', 'postres'];
      const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
        const aCat = categories.find((c) => c.id === a);
        const bCat = categories.find((c) => c.id === b);
        if (aCat && bCat) {
          const aIdx = categoryOrder.indexOf(aCat.name.toLowerCase());
          const bIdx = categoryOrder.indexOf(bCat.name.toLowerCase());
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return 1;
          if (bIdx !== -1) return 1;
          return aCat.display_order - bCat.display_order;
        }
        return 0;
      });
      for (const key of sortedKeys) {
        const entry = grouped.get(key)!;
        result.push({ id: `daily-${key}`, name: entry.name, dishes: entry.dishes });
      }

      if (sideDishes.length > 0) result.push({ id: 'daily-sides', name: 'Contornos del Día', dishes: sideDishes });
      return result;
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
  }, [activeCategory, categories, dishes, dailySides]);

  const visiblePromos = useMemo(
    () => promos.filter((p) => p.is_active).slice(0, 8),
    [promos]
  );

  return (
    <div className="flex min-h-dvh flex-col bg-brand-darker">
      {/* Encabezado unificado: botón de retorno + tabs siempre visibles */}
      <header className="sticky top-0 z-40 bg-brand-darker/92 shadow-elevated backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-2.5 sm:px-6 sm:pt-3">
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
        <div
          aria-hidden
          className="h-px w-full bg-gradient-to-r from-transparent via-brand-primary/35 to-transparent"
        />
      </header>

      <main
        id="menu"
        className="mx-auto w-full max-w-5xl scroll-mt-28 flex-1 px-4 pt-6 pb-24 sm:px-6 sm:pt-8"
      >
        {visiblePromos.length > 0 && (
          <section aria-label="Promociones vigentes" className="mb-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-bold text-brand-light sm:text-xl">Promociones</h2>
              <span
                aria-hidden
                className="h-px flex-1 bg-gradient-to-r from-brand-accent/50 to-transparent"
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
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-gradient-to-r from-brand-primary/45 to-transparent"
                  />
                  <span className="rounded-full bg-white/[0.04] px-2.5 py-1 font-heading text-[11px] font-semibold text-brand-light/40 ring-1 ring-white/[0.06]">
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
                      viewOnly={dish.is_side_dish}
                      onRequestAdd={(d) => {
                        if (canHaveSides(d)) setSideDishTarget(d);
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

      <MenuFooter schedule={schedule} />

      {count > 0 && !isCartOpen && (
        <div className="fixed right-4 bottom-5 z-40 flex flex-col items-end gap-3">
          {/* Toast de confirmación */}
          <AnimatePresence>
            {justAdded && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 480, damping: 28 }}
                className="pointer-events-none flex items-center gap-2 rounded-full bg-brand-dark/95 py-2 pr-4 pl-3 font-heading text-xs font-bold text-brand-light ring-1 ring-brand-primary/40 shadow-elevated backdrop-blur-md"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary/20">
                  <CheckCircle2 className="size-3 text-brand-primary" aria-hidden />
                </span>
                Agregado al carrito
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            {/* Anillo expansivo al agregar */}
            <AnimatePresence>
              {justAdded && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0.65, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-brand-primary"
                />
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={() => setIsCartOpen(true)}
              initial={{ scale: 0.5, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-accent to-brand-primary py-2.5 pr-5 pl-4 font-heading text-sm font-bold text-brand-darker shadow-glow-accent transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-darker"
            >
              <motion.span
                animate={
                  justAdded
                    ? { rotate: [0, -14, 12, -8, 6, 0], scale: [1, 1.3, 1] }
                    : { rotate: 0, scale: 1 }
                }
                transition={{ duration: 0.55 }}
                className="flex"
              >
                <ShoppingBag className="size-5" aria-hidden />
              </motion.span>
              <span className="flex flex-col leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-4 min-w-4 justify-center overflow-hidden tabular-nums">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={count}
                        initial={{ y: -14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 14, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="flex items-center"
                      >
                        {count}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  {count === 1 ? 'plato' : 'platos'}
                </span>
                <span className="mt-1 text-[11px] font-semibold opacity-80">{formatPrice(total)}</span>
              </span>
            </motion.button>
          </div>
        </div>
      )}

      <DishModal
        dish={selectedDish}
        rate={rate}
        onClose={() => setSelectedDish(null)}
        onRequestAdd={(d) => {
          if (canHaveSides(d)) {
            setSelectedDish(null);
            setSideDishTarget(d);
          } else {
            addDishWithSides(d, []);
            setSelectedDish(null);
          }
        }}
      />
      <PromoModal promo={selectedPromo} onClose={() => setSelectedPromo(null)} />
      {isCartOpen && <CartSheet rate={rate} deliveryZones={deliveryZones} onClose={() => setIsCartOpen(false)} />}
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

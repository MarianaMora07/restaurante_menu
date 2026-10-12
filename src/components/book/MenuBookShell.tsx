'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import type { Category, DeliveryZone, Dish, Promo, RestaurantSchedule, UsdRateInfo } from '@/types/database';
import { LandingView } from '@/components/landing/LandingView';
import { MenuView } from '@/components/menu/MenuView';
import { RestaurantClosedView } from '@/components/landing/RestaurantClosedView';
import { isScheduleOpen } from '@/lib/schedule';

type BookPage = 'landing' | 'menu';

interface MenuBookShellProps {
  promos: Promo[];
  categories: Category[];
  dishes: Dish[];
  deliveryZones: DeliveryZone[];
  rate: UsdRateInfo | null;
  schedule: RestaurantSchedule | null;
  isAdmin?: boolean;
}

/* Portada (landing): gira sobre su borde izquierdo como hoja de libro hacia la derecha.
   El giro se limita a <90° y el fundido corre en paralelo: pasar del plano de la pantalla
   colapsaría la portada en una línea clara al centro y bloquearía los clics hasta desmontar. */
const coverVariants: Variants = {
  hidden: { rotateY: 78, opacity: 0 },
  visible: {
    rotateY: 0,
    opacity: 1,
    transition: {
      rotateY: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.28, ease: 'easeOut' },
    },
  },
  exit: {
    rotateY: 82,
    opacity: 0,
    transition: {
      rotateY: { duration: 0.6, ease: [0.32, 0, 0.24, 1] },
      opacity: { duration: 0.45, ease: 'easeIn' },
    },
  },
};

const coverTransition = { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as const;

/* Hoja interior (menú): se revela por debajo con ligero retroceso en profundidad. */
const sheetVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, x: '-4%' },
  visible: { opacity: 1, scale: 1, x: 0 },
  exit: { opacity: 0, scale: 0.96, x: '-4%' },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function MenuBookShell({ promos, categories, dishes, deliveryZones, rate, schedule, isAdmin = false }: MenuBookShellProps) {
  const [page, setPage] = useState<BookPage>('landing');
  const prefersReducedMotion = useReducedMotion();
  // isOpen se calcula en cliente (Intl → America/Caracas) y se re-evalúa cada minuto.
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  const openMenu = useCallback(() => setPage('menu'), []);
  const closeMenu = useCallback(() => setPage('landing'), []);

  useEffect(() => {
    const check = () => setIsOpen(isScheduleOpen(schedule));
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [schedule]);

  useEffect(() => {
    document.body.classList.toggle('book-menu-open', page === 'menu');
    return () => document.body.classList.remove('book-menu-open');
  }, [page]);

  useEffect(() => {
    if (page !== 'menu') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [page, closeMenu]);

  // isOpen === null → aún no se calculó (evita flash de "cerrado" en SSR/hidratación).
  // isAdmin: el panel logueado omite el bloqueo para previsualizar el menú público.
  if (isOpen === false && !isAdmin) {
    return <RestaurantClosedView schedule={schedule} />;
  }

  const cover = prefersReducedMotion ? fadeVariants : coverVariants;
  const sheet = prefersReducedMotion ? fadeVariants : sheetVariants;

  return (
    <div className="relative min-h-dvh bg-brand-darker [perspective:1600px]">
      <AnimatePresence initial={false}>
        {page === 'landing' && (
          <motion.div
            key="cover"
            variants={cover}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0.3 } : coverTransition}
            className="relative z-20 [backface-visibility:hidden] [transform-origin:left_center]"
          >
            <LandingView onOpenMenu={openMenu} schedule={schedule} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {page === 'menu' && (
          <motion.div
            key="sheet"
            variants={sheet}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-10 overflow-y-auto overscroll-contain bg-brand-darker"
          >
            <MenuView
              categories={categories}
              dishes={dishes}
              promos={promos}
              deliveryZones={deliveryZones}
              rate={rate}
              schedule={schedule}
              onBack={closeMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

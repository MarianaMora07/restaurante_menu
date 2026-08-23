'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import type { Category, Dish, Promo, UsdRateInfo } from '@/types/database';
import { LandingView } from '@/components/landing/LandingView';
import { MenuView } from '@/components/menu/MenuView';

type BookPage = 'landing' | 'menu';

interface MenuBookShellProps {
  promos: Promo[];
  categories: Category[];
  dishes: Dish[];
  rate: UsdRateInfo | null;
}

/* Portada (landing): gira sobre su borde izquierdo como hoja de libro hacia la derecha. */
const coverVariants: Variants = {
  hidden: { rotateY: 100 },
  visible: { rotateY: 0 },
  exit: {
    rotateY: 100,
    opacity: 0,
    transition: {
      rotateY: { duration: 0.85, ease: [0.7, 0, 0.3, 1] },
      opacity: { duration: 0.3, delay: 0.42 },
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

export function MenuBookShell({ promos, categories, dishes, rate }: MenuBookShellProps) {
  const [page, setPage] = useState<BookPage>('landing');
  const prefersReducedMotion = useReducedMotion();

  const openMenu = useCallback(() => setPage('menu'), []);
  const closeMenu = useCallback(() => setPage('landing'), []);

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
            <LandingView onOpenMenu={openMenu} />
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
              rate={rate}
              onBack={closeMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

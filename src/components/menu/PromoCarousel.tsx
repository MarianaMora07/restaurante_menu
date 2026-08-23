'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import type { Promo } from '@/types/database';
import { cn } from '@/lib/utils';

interface PromoCarouselProps {
  promos: Promo[];
  onSelect: (promo: Promo) => void;
}

/* Deslizamiento horizontal direccional entre flyers. */
const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? '100%' : '-100%',
    opacity: 0.5,
  }),
  center: { x: '0%', opacity: 1 },
  exit: (direction: number) => ({
    x: direction >= 0 ? '-35%' : '35%',
    opacity: 0,
  }),
};

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function PromoCarousel({ promos, onSelect }: PromoCarouselProps) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const paginate = useCallback(
    (step: number) => {
      setPage(([current]) => [(current + step + promos.length) % promos.length, step]);
    },
    [promos.length]
  );

  useEffect(() => {
    if (isPaused || promos.length < 2) return;
    const seconds = Math.min(30, Math.max(3, promos[index]?.duration_seconds ?? 6));
    const timer = setTimeout(() => {
      if (!document.hidden) paginate(1);
    }, seconds * 1000);
    return () => clearTimeout(timer);
  }, [index, isPaused, promos, paginate]);

  if (promos.length === 0) return null;

  const promo = promos[Math.min(index, promos.length - 1)];
  const variants = prefersReducedMotion ? fadeVariants : slideVariants;

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white/[0.03] shadow-elevated ring-1 ring-brand-primary/25 sm:aspect-[21/9]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={promo.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: prefersReducedMotion ? 0.25 : 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0"
        >
          <button
            type="button"
            onClick={() => onSelect(promo)}
            aria-label={`Ver detalles de la promoción ${promo.title}`}
            className="group absolute inset-0 cursor-pointer text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-primary"
          >
            <Image
              src={promo.image_url}
              alt={promo.title}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-brand-darker/90 via-brand-darker/20 to-transparent"
            />
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-brand-darker/60 px-3 py-1 font-heading text-xs font-bold tracking-wide text-brand-primary uppercase ring-1 ring-brand-primary/40 backdrop-blur-sm">
              <Megaphone className="size-3.5" aria-hidden />
              Promoción
            </span>
            <span className="absolute inset-x-4 bottom-5 flex flex-col gap-1 sm:inset-x-6 sm:bottom-6">
              <span className="font-display text-lg font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] sm:text-2xl">
                {promo.title}
              </span>
              {promo.description && (
                <span className="line-clamp-2 max-w-xl text-xs leading-relaxed text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] sm:text-sm">
                  {promo.description}
                </span>
              )}
            </span>
          </button>
        </motion.div>
      </AnimatePresence>

      {promos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => paginate(-1)}
            aria-label="Promoción anterior"
            className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white ring-1 ring-white/15 backdrop-blur-sm transition-all hover:bg-black/65 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => paginate(1)}
            aria-label="Siguiente promoción"
            className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white ring-1 ring-white/15 backdrop-blur-sm transition-all hover:bg-black/65 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <div className="absolute inset-x-0 bottom-1.5 z-10 flex justify-center gap-1.5">
            {promos.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage([dotIndex, dotIndex > index ? 1 : -1])}
                aria-label={`Ir a la promoción ${item.title}`}
                aria-current={dotIndex === index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
                  dotIndex === index
                    ? 'w-5 bg-brand-primary'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import type { Promo } from '@/types/database';
import { cn } from '@/lib/utils';

interface PromoBannerProps {
  promos: Promo[];
}

export function PromoBanner({ promos }: PromoBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((target: number) => {
    const container = containerRef.current;
    const child = container?.children[target] as HTMLElement | undefined;
    if (!container || !child) return;
    container.scrollTo({ left: child.offsetLeft - container.offsetLeft, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (paused || promos.length < 2) return;
    const seconds = Math.min(30, Math.max(3, promos[index]?.duration_seconds ?? 6));
    const timer = setTimeout(() => goTo((index + 1) % promos.length), seconds * 1000);
    return () => clearTimeout(timer);
  }, [index, paused, promos.length, promos, goTo]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    Array.from(container.children).forEach((node, i) => {
      const child = node as HTMLElement;
      const childCenter = child.offsetLeft - container.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(childCenter - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    setIndex(best);
  }

  if (promos.length === 0) return null;

  return (
    <section
      id="promos"
      aria-label="Promociones y eventos"
      className="relative scroll-mt-16 overflow-hidden bg-brand-darker py-14 sm:py-20"
    >
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6">
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-2 font-heading text-xs font-semibold tracking-[0.22em] text-brand-primary uppercase">
            <Megaphone className="size-3.5" aria-hidden />
            No te lo pierdas
          </p>
          <h2 className="font-display text-3xl font-bold text-brand-light sm:text-4xl">
            Promociones &amp; Eventos
          </h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <ArrowButton
            label="Promoción anterior"
            onClick={() => goTo((index - 1 + promos.length) % promos.length)}
            icon={<ChevronLeft className="size-5" aria-hidden />}
          />
          <ArrowButton
            label="Promoción siguiente"
            onClick={() => goTo((index + 1) % promos.length)}
            icon={<ChevronRight className="size-5" aria-hidden />}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-6"
      >
        {promos.map((promo, i) => (
          <motion.article
            key={promo.id}
            aria-hidden={i !== index}
            className="group relative aspect-[16/10] w-[82vw] max-w-[440px] shrink-0 snap-center overflow-hidden rounded-2xl shadow-elevated ring-1 ring-brand-primary/35 transition-shadow duration-300 hover:shadow-card-hover focus-within:ring-brand-primary/60 sm:w-[440px]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <Image
              src={promo.image_url}
              alt={promo.title}
              fill
              sizes="(min-width: 640px) 440px, 82vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              priority={i === 0}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-brand-darker via-brand-darker/25 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
              <span className="w-fit rounded-full bg-white/[0.08] px-3 py-1 font-heading text-[10px] font-bold tracking-[0.18em] text-brand-primary uppercase ring-1 ring-brand-primary/30 backdrop-blur-md">
                Promoción
              </span>
              <h3 className="font-heading text-xl leading-snug font-bold text-brand-light">
                {promo.title}
              </h3>
              {promo.description && (
                <p className="line-clamp-2 text-sm leading-relaxed text-brand-light/75">
                  {promo.description}
                </p>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2 px-4">
        {promos.map((promo, i) => (
          <button
            key={promo.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir a la promoción ${promo.title}`}
            aria-current={i === index}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
              i === index
                ? 'w-7 bg-brand-primary'
                : 'w-1.5 bg-white/20 hover:bg-white/45'
            )}
          />
        ))}
      </div>
    </section>
  );
}

interface ArrowButtonProps {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function ArrowButton({ label, onClick, icon }: ArrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full bg-white/[0.05] text-brand-light/70 ring-1 ring-white/12 backdrop-blur-sm transition-all hover:bg-brand-primary/15 hover:text-brand-primary hover:ring-brand-primary/35 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
    >
      {icon}
    </button>
  );
}

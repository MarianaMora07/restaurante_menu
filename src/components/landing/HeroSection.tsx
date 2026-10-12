'use client';

import { Sparkles } from 'lucide-react';
import { siteConfig } from '@/config/site';

interface HeroSectionProps {
  onOpenMenu: () => void;
}

/* Contenido central del hero; el video vive en LandingView y el footer completa
   la columna flex, por lo que aquí solo se despeja la navbar fija. */
export function HeroSection({ onOpenMenu }: HeroSectionProps) {
  return (
    <section
      aria-label="Inicio"
      className="relative z-20 flex flex-1 items-center justify-center overflow-hidden px-5 pt-24 pb-8 sm:px-8 sm:pt-28 lg:pt-32"
    >
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-3xl bg-white/[0.03] px-6 py-8 text-center ring-1 ring-white/[0.08] backdrop-blur-[2px] sm:gap-6 sm:px-10 sm:py-10">
        <p className="flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-1.5 font-heading text-[11px] font-semibold tracking-[0.22em] text-brand-primary uppercase ring-1 ring-brand-primary/30 backdrop-blur-sm animate-fade-in-up [animation-delay:80ms] sm:text-xs">
          <Sparkles className="size-3.5" aria-hidden />
          {siteConfig.name}
        </p>

        <h1 className="font-display text-4xl leading-[1.08] font-bold text-balance text-brand-light [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.9))_drop-shadow(0_0_28px_rgba(0,0,0,0.55))] animate-fade-in-up [animation-delay:160ms] sm:text-6xl sm:leading-[1.05] lg:text-7xl">
          Sabores que{' '}
          <em className="text-glow-primary text-brand-primary italic">se recuerdan</em>
        </h1>

        <p className="max-w-md text-sm leading-relaxed text-brand-light/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] animate-fade-in-up [animation-delay:240ms] sm:max-w-xl sm:text-lg">
          Explora nuestra carta, descubre las promociones de la casa y consulta la
          disponibilidad del Menú del Día al instante por WhatsApp.
        </p>

        <div className="mt-1 flex w-full items-center justify-center sm:w-auto animate-fade-in-up [animation-delay:320ms]">
          <button
            type="button"
            onClick={onOpenMenu}
            className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary font-heading text-sm font-bold text-[#260101] shadow-glow-accent transition-transform duration-200 animate-pulse-glow hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:h-14 sm:w-auto sm:px-10 sm:text-base"
          >
            <span className="relative z-[1]">Abrir Menú de Platos</span>
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shine"
            />
          </button>
        </div>
      </div>
    </section>
  );
}

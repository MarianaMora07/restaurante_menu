'use client';

import { Sparkles } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { scrollToSection } from '@/lib/utils';

interface HeroSectionProps {
  hasPromos: boolean;
}

export function HeroSection({ hasPromos }: HeroSectionProps) {
  return (
    <section
      aria-label="Inicio"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-darker"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src="/videos/video_login.mp4" type="video/mp4" />
      </video>

      {/* Superposición de degradado de marca */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 bg-gradient-to-t from-[#260101] via-[#260101]/70 to-[#260101]/40"
      />

      {/* Difuminado inferior: transición orgánica del video hacia el contenido */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[#260101] to-transparent"
      />

      <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-28 text-center">
        <p className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 font-heading text-xs font-semibold tracking-[0.22em] text-brand-primary uppercase ring-1 ring-brand-primary/25 backdrop-blur-sm animate-fade-in-up [animation-delay:80ms]">
          <Sparkles className="size-3.5" aria-hidden />
          {siteConfig.name}
        </p>

        <h1 className="font-display text-5xl leading-[1.05] font-bold text-balance text-brand-light drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl animate-fade-in-up [animation-delay:160ms]">
          Sabores que{' '}
          <em className="text-glow-primary text-brand-primary italic">se recuerdan</em>
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-brand-light/75 sm:text-lg animate-fade-in-up [animation-delay:240ms]">
          Explora nuestra carta, descubre las promociones de la casa y consulta la
          disponibilidad del Menú del Día al instante por WhatsApp.
        </p>

        <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row animate-fade-in-up [animation-delay:320ms]">
          <button
            type="button"
            onClick={() => scrollToSection('menu')}
            className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-brand-accent to-brand-primary font-heading text-base font-bold text-[#260101] shadow-glow-accent transition-transform duration-200 animate-pulse-glow hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:w-auto sm:px-10"
          >
            <span className="relative z-[1]">Explorar Menú</span>
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shine"
            />
          </button>
          {hasPromos && (
            <button
              type="button"
              onClick={() => scrollToSection('promos')}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-white/[0.08] font-heading text-base font-semibold text-brand-light/90 ring-1 ring-white/15 backdrop-blur-sm transition-all hover:bg-white/[0.12] hover:text-brand-primary hover:ring-brand-primary/35 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:w-auto sm:px-8"
            >
              Ver promociones
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

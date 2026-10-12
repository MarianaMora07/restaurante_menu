'use client';

import { Clock, Lock, MessageCircle, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import type { RestaurantSchedule } from '@/types/database';
import { getScheduleSlots } from '@/lib/schedule';
import { buildWhatsAppUrl } from '@/lib/utils';

interface MenuFooterProps {
  schedule: RestaurantSchedule | null;
}

/* Pie de la vista de menú: 3 columnas simétricas (marca · horario ·
   contacto), en tono con el footer de la portada. Horario dinámico
   del admin en AM/PM con contenido centrado en la tarjeta. */
export function MenuFooter({ schedule }: MenuFooterProps) {
  const year = new Date().getFullYear();
  const slots = getScheduleSlots(schedule);
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <footer className="relative mt-8 overflow-hidden bg-gradient-to-b from-black/35 via-black/50 to-black/65 backdrop-blur-md">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/45 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-1/2 -top-28 h-48 w-[32rem] max-w-none -translate-x-1/2 rounded-full bg-brand-primary/[0.04] blur-3xl"
      />

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 px-4 py-8 text-center sm:grid-cols-3 sm:gap-10 sm:px-6 sm:py-10">
        <div className="flex flex-col items-center gap-1.5">
          <span className="mb-1 flex size-9 items-center justify-center rounded-full bg-brand-primary/10 ring-1 ring-brand-primary/25 backdrop-blur-sm">
            <UtensilsCrossed className="size-4 text-brand-primary" aria-hidden />
          </span>
          <p className="font-display text-lg leading-tight font-bold text-brand-light sm:text-xl">
            {siteConfig.name}
          </p>
          <p className="text-xs text-brand-light/45">{siteConfig.tagline}</p>
        </div>

        {slots.length > 0 && (
          <div className="flex flex-col items-center gap-2.5">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-brand-primary uppercase">
              <Clock className="size-3.5" aria-hidden />
              Horario
            </p>
            <ul className="flex w-full max-w-[14rem] flex-col items-center gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.07] backdrop-blur-sm">
              {slots.map((slot, i) => (
                <li key={slot.days} className="flex w-full flex-col items-center gap-0.5">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="mb-1 h-px w-7 bg-white/[0.08]"
                    />
                  )}
                  <span className="text-[11px] font-medium text-brand-light/55 sm:text-xs">
                    {slot.days}
                  </span>
                  <span
                    className={
                      slot.time === 'Cerrado'
                        ? 'text-xs font-semibold text-brand-light/30'
                        : 'font-heading text-sm font-bold text-brand-primary'
                    }
                  >
                    {slot.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-accent to-brand-primary px-6 py-2.5 font-heading text-xs font-bold text-brand-darker shadow-glow-accent transition-all hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:text-sm"
            >
              <MessageCircle className="size-4" aria-hidden />
              Pedidos por WhatsApp
            </a>
          )}
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-brand-light/30 sm:text-[11px]">
              © {year} {siteConfig.name}
            </p>
            <Link
              href="/login"
              aria-label="Panel de administración"
              className="rounded-full p-1 text-brand-light/15 transition-all hover:bg-white/[0.06] hover:text-brand-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <Lock className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {/* Ornamento inferior */}
      <div aria-hidden className="mx-auto mb-4 flex max-w-[12rem] items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.08]" />
        <span className="size-1 rounded-full bg-brand-primary/40" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.08]" />
      </div>
    </footer>
  );
}

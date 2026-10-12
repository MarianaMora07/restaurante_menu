'use client';

import { Clock, MessageCircle } from 'lucide-react';
import type { RestaurantSchedule } from '@/types/database';
import { siteConfig } from '@/config/site';
import { DAY_LABELS, formatTime12, getNextOpening } from '@/lib/schedule';
import { buildWhatsAppUrl } from '@/lib/utils';

interface RestaurantClosedViewProps {
  schedule: RestaurantSchedule | null;
}

export function RestaurantClosedView({ schedule }: RestaurantClosedViewProps) {
  const days = schedule?.enabled && Array.isArray(schedule.days) ? schedule.days : null;
  const next = schedule && days ? getNextOpening(schedule) : null;
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-darker">
      {/* Fondo: mismo video de la portada */}
      <div aria-hidden className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="h-full w-full object-cover">
          <source src="/videos/video_login.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#260101] via-[#260101]/80 to-[#260101]/50" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-primary/15 px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-brand-primary uppercase ring-1 ring-brand-primary/40">
          <Clock className="size-3.5" aria-hidden />
          Cerrado ahora
        </span>

        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-light sm:text-4xl">
          {siteConfig.name}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-light/60 sm:text-base">
          Estamos fuera de nuestro horario de atención. ¡Vuelve pronto!
        </p>

        <div className="mt-8 w-full max-w-sm rounded-2xl bg-brand-dark/80 p-5 text-left ring-1 ring-brand-primary/25 backdrop-blur-sm">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-brand-primary uppercase">
            <Clock className="size-3.5" aria-hidden />
            Nuestro horario
          </p>
          {days ? (
            <ul className="flex flex-col gap-2">
              {[...days]
                .sort((a, b) => a.day - b.day)
                .map((d) => (
                  <li
                    key={d.day}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium text-brand-light/70">{DAY_LABELS[d.day]}</span>
                    <span className={d.isOpen ? 'font-semibold text-brand-light' : 'font-semibold text-brand-light/35'}>
                      {d.isOpen ? `${formatTime12(d.open)} – ${formatTime12(d.close)}` : 'Cerrado'}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-2">
              {siteConfig.hours.map((h) => (
                <li key={h.days} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-brand-light/70">{h.days}</span>
                  <span className="font-semibold text-brand-light">{h.time}</span>
                </li>
              ))}
            </ul>
          )}

          {next && (
            <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs text-brand-light/45">
              Abrimos: <span className="font-semibold text-brand-primary">{DAY_LABELS[next.day]}</span>{' '}
              a las <span className="font-semibold text-brand-primary">{formatTime12(next.open)}</span>
            </p>
          )}
        </div>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent to-brand-primary px-6 py-3 font-heading text-sm font-bold text-brand-darker shadow-elevated transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <MessageCircle className="size-4" aria-hidden />
            Escríbenos por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Clock, Lock, MapPin, MessageCircle, UtensilsCrossed } from 'lucide-react';
import { siteConfig } from '@/config/site';
import type { RestaurantSchedule } from '@/types/database';
import { formatTime12, getScheduleSlots } from '@/lib/schedule';
import { buildWhatsAppUrl } from '@/lib/utils';

interface FooterProps {
  schedule: RestaurantSchedule | null;
}

/* Pie de la portada: franja compacta al fondo para dejar ver el video.
   3 columnas simétricas (marca · horario · contacto) en una sola línea
   densa. Horario dinámico del admin en AM/PM. Fallback a siteConfig. */
export function Footer({ schedule }: FooterProps) {
  const year = new Date().getFullYear();
  const slots = getScheduleSlots(schedule);
  const hours = slots.length
    ? slots
    : siteConfig.hours.map((slot) => ({
        days: slot.days,
        time: convertRangeTo12h(slot.time),
      }));

  return (
    <footer
      id="contacto"
      className="relative bg-gradient-to-b from-black/25 via-black/55 to-black/70 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      {/* Línea decorativa superior */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/45 to-transparent"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-3 px-4 py-3 text-center sm:grid-cols-[auto_1fr_auto] sm:gap-6 sm:px-6 sm:py-3.5">
        {/* Marca */}
        <div className="flex items-center justify-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 ring-1 ring-brand-primary/25">
            <UtensilsCrossed className="size-3.5 text-brand-primary" aria-hidden />
          </span>
          <div className="flex flex-col items-start text-left">
            <p className="font-display text-sm leading-tight font-bold text-brand-light sm:text-base">
              {siteConfig.name}
            </p>
            <p className="hidden text-[10px] text-brand-light/40 sm:block">
              {siteConfig.tagline}
            </p>
          </div>
        </div>

        {/* Horario — inline compacto */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-[10px] font-bold tracking-[0.16em] text-brand-primary uppercase">
            <Clock className="size-3" aria-hidden />
            Horario
          </span>
          {hours.map((slot) => (
            <span
              key={slot.days}
              className="flex items-baseline gap-1.5 text-[11px] whitespace-nowrap"
            >
              <span className="font-medium text-brand-light/60">{slot.days}</span>
              <span
                className={
                  slot.time === 'Cerrado'
                    ? 'font-semibold text-brand-light/30'
                    : 'font-semibold text-brand-primary'
                }
              >
                {slot.time}
              </span>
            </span>
          ))}
          {siteConfig.address && (
            <span className="flex items-center gap-1 text-[10px] text-brand-light/40">
              <MapPin className="size-3 shrink-0 text-brand-primary/50" aria-hidden />
              {siteConfig.address}
            </span>
          )}
        </div>

        {/* Contacto */}
        <div className="flex items-center justify-center gap-3">
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-accent to-brand-primary px-3.5 py-1.5 font-heading text-[11px] font-bold text-brand-darker shadow-glow-accent transition-all hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:text-xs"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            WhatsApp
          </a>
          <p className="text-[10px] text-brand-light/25">© {year}</p>
          <Link
            href="/login"
            aria-label="Panel de administración"
            className="rounded-full p-1 text-brand-light/15 transition-all hover:bg-white/[0.06] hover:text-brand-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <Lock className="size-3" aria-hidden />
          </Link>
        </div>
      </div>
    </footer>
  );
}

function convertRangeTo12h(range: string): string {
  const match = range.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return range;
  return `${formatTime12(`${match[1].padStart(2, '0')}:${match[2]}`)} – ${formatTime12(`${match[3].padStart(2, '0')}:${match[4]}`)}`;
}

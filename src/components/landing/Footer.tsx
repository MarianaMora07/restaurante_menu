import Link from 'next/link';
import { Clock, Lock, MapPin, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { buildWhatsAppUrl } from '@/lib/utils';

/* Franja de información compacta, superpuesta en la parte inferior del hero.
   En móvil se comprime a dos columnas envolventes para ocupar la mínima altura. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contacto"
      className="relative border-t border-white/5 bg-black/55 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-x-8 gap-y-2 px-4 py-3 text-center sm:flex-row sm:px-6 sm:py-4 sm:text-left">
        <div className="flex flex-col items-center gap-0.5 sm:items-start">
          <p className="font-display text-base leading-tight font-bold text-brand-light sm:text-lg">
            {siteConfig.name}
          </p>
          <p className="hidden text-xs text-brand-light/60 sm:block">{siteConfig.tagline}</p>
        </div>

        <ul className="flex max-w-xs flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:flex-col sm:items-start">
          {siteConfig.hours.map((slot) => (
            <li
              key={slot.days}
              className="flex items-center gap-1.5 text-[11px] text-brand-light/70 sm:text-xs"
            >
              <Clock className="size-3 shrink-0 text-brand-primary/70 sm:size-3.5" aria-hidden />
              {slot.days} · {slot.time}
            </li>
          ))}
          {siteConfig.address && (
            <li className="flex items-center gap-1.5 text-[11px] text-brand-light/70 sm:text-xs">
              <MapPin className="size-3 shrink-0 text-brand-primary/70 sm:size-3.5" aria-hidden />
              {siteConfig.address}
            </li>
          )}
        </ul>

        <div className="flex flex-col items-center gap-1.5 sm:items-end sm:gap-2">
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-medium text-brand-light/85 ring-1 ring-white/10 transition-all hover:bg-brand-primary/10 hover:text-brand-primary hover:ring-brand-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:px-3.5 sm:py-2 sm:text-xs"
          >
            <MessageCircle className="size-3.5 sm:size-4" aria-hidden />
            Pedidos por WhatsApp
          </a>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-brand-light/35 sm:text-[11px]">
              © {year} {siteConfig.name}
            </p>
            <Link
              href="/login"
              aria-label="Panel de administración"
              className="rounded-full p-1 text-brand-light/20 transition-all hover:bg-white/[0.06] hover:text-brand-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <Lock className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

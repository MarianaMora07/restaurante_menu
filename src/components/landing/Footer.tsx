import Link from 'next/link';
import { Clock, Lock, MapPin, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { buildWhatsAppUrl } from '@/lib/utils';

/* Franja de información compacta, superpuesta en la parte inferior del hero. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contacto"
      className="relative border-t border-white/5 bg-black/55 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-x-8 gap-y-3 px-6 py-4 text-center sm:flex-row sm:text-left">
        <div className="flex flex-col items-center gap-0.5 sm:items-start">
          <p className="font-display text-lg leading-tight font-bold text-brand-light">
            {siteConfig.name}
          </p>
          <p className="text-xs text-brand-light/60">{siteConfig.tagline}</p>
        </div>

        <ul className="flex flex-col items-center gap-1 sm:items-start">
          {siteConfig.hours.map((slot) => (
            <li
              key={slot.days}
              className="flex items-center gap-1.5 text-xs text-brand-light/70"
            >
              <Clock className="size-3.5 shrink-0 text-brand-primary/70" aria-hidden />
              {slot.days} · {slot.time}
            </li>
          ))}
          {siteConfig.address && (
            <li className="flex items-center gap-1.5 text-xs text-brand-light/70">
              <MapPin className="size-3.5 shrink-0 text-brand-primary/70" aria-hidden />
              {siteConfig.address}
            </li>
          )}
        </ul>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-brand-light/85 ring-1 ring-white/10 transition-all hover:bg-brand-primary/10 hover:text-brand-primary hover:ring-brand-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <MessageCircle className="size-4 transition-colors group-hover:text-[#25D366]" aria-hidden />
            Pedidos por WhatsApp
          </a>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-brand-light/35">
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

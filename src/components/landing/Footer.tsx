import Link from 'next/link';
import { Clock, Lock, MapPin, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { buildWhatsAppUrl } from '@/lib/utils';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contacto"
      className="relative mt-auto scroll-mt-16 border-t border-white/5 bg-black/35 pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+3rem))] backdrop-blur-sm lg:pb-0"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <p className="font-display text-2xl font-bold text-brand-light">
            {siteConfig.name}
          </p>
          <span aria-hidden className="h-0.5 w-10 rounded-full bg-brand-primary" />
          <p className="max-w-xs text-sm leading-relaxed text-brand-light/55">
            {siteConfig.tagline}. Consulta nuestra carta y reserva tu pedido por
            WhatsApp.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-xs font-semibold tracking-[0.22em] text-brand-primary uppercase">
            Horarios
          </h2>
          <ul className="flex flex-col gap-2">
            {siteConfig.hours.map((slot) => (
              <li
                key={slot.days}
                className="flex items-center gap-2.5 text-sm text-brand-light/70"
              >
                <Clock className="size-4 shrink-0 text-brand-primary/70" aria-hidden />
                {slot.days} · {slot.time}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-xs font-semibold tracking-[0.22em] text-brand-primary uppercase">
            Contacto
          </h2>
          {siteConfig.address && (
            <p className="flex items-start gap-2.5 text-sm text-brand-light/70">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-primary/70" aria-hidden />
              {siteConfig.address}
            </p>
          )}
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-fit items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-brand-light/80 ring-1 ring-white/10 transition-all hover:bg-brand-primary/10 hover:text-brand-primary hover:ring-brand-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary -mx-3"
          >
            <MessageCircle className="size-4 shrink-0 transition-colors group-hover:text-[#25D366]" aria-hidden />
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <p className="text-xs text-brand-light/40">
            © {year} {siteConfig.name}. Todos los derechos reservados.
          </p>
          <Link
            href="/login"
            aria-label="Panel de administración"
            className="rounded-full p-2 text-brand-light/20 transition-all hover:bg-white/[0.06] hover:text-brand-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <Lock className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </footer>
  );
}

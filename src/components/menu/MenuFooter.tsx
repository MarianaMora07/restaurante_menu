'use client';

import { Clock, MessageCircle, UtensilsCrossed } from 'lucide-react';
import { siteConfig } from '@/config/site';
import type { RestaurantSchedule } from '@/types/database';
import { getScheduleSlots } from '@/lib/schedule';
import { buildWhatsAppUrl } from '@/lib/utils';

interface MenuFooterProps {
  schedule: RestaurantSchedule | null;
}

/* Pie de la vista de menú: compacto en 2 filas — marca + horario
   arriba, contacto + copyright abajo. Sin ornamentación extra. */
export function MenuFooter({ schedule }: MenuFooterProps) {
  const year = new Date().getFullYear();
  const slots = getScheduleSlots(schedule);
  const whatsappUrl = buildWhatsAppUrl();

  return (
    <footer className="relative mt-6 overflow-hidden border-t border-white/[0.06] bg-black/55 backdrop-blur-md">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6">
        {/* Fila 1: marca + horario */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="size-3.5 text-brand-primary/70" aria-hidden />
            <span className="font-display text-sm font-bold text-brand-light/90">
              {siteConfig.name}
            </span>
          </div>

          {slots.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 text-brand-primary/50" aria-hidden />
              <span className="text-[11px] text-brand-light/40">
                {slots[0]?.days}: {slots[0]?.time}
                {slots.length > 1 && (
                  <span className="text-brand-light/25"> · {slots.length} horarios</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Fila 2: chip WhatsApp */}
        {whatsappUrl && (
          <div className="mt-3 flex justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3.5 py-1.5 text-[11px] font-semibold text-brand-primary ring-1 ring-brand-primary/20 transition-all hover:bg-brand-primary/20 hover:ring-brand-primary/40 active:scale-95"
            >
              <MessageCircle className="size-3" aria-hidden />
              Pedidos por WhatsApp
            </a>
          </div>
        )}

        {/* Fila 3: copyright */}
        <p className="mt-3 text-center text-[10px] text-brand-light/25">
          © {year} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}

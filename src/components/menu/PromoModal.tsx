'use client';

import Image from 'next/image';
import { Megaphone, UtensilsCrossed, X } from 'lucide-react';
import type { Promo } from '@/types/database';
import { ModalShell } from '@/components/ui/ModalShell';

interface PromoModalProps {
  promo: Promo | null;
  onClose: () => void;
}

export function PromoModal({ promo, onClose }: PromoModalProps) {
  if (!promo) return null;

  return (
    <ModalShell onClose={onClose} label={promo.title}>
      <div className="relative aspect-[16/10] w-full shrink-0 bg-white/[0.04]">
        <Image
          src={promo.image_url}
          alt={promo.title}
          fill
          sizes="(min-width: 640px) 512px, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-dark to-transparent"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalles de la promoción"
          className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white ring-1 ring-white/15 backdrop-blur-sm transition-all hover:scale-105 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:scale-95"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 shrink-0 text-brand-primary" aria-hidden />
          <span className="font-heading text-xs font-bold tracking-[0.18em] text-brand-primary uppercase">
            Promoción vigente
          </span>
        </div>
        <h2 className="font-heading text-xl leading-snug font-bold text-brand-light sm:text-2xl">
          {promo.title}
        </h2>
        <p className="text-sm leading-relaxed text-brand-light/70">
          {promo.description?.trim() ||
            'Promoción vigente por tiempo limitado. Consulta condiciones y disponibilidad con nuestro equipo.'}
        </p>
        {!promo.description?.trim() && (
          <UtensilsCrossed className="size-6 self-end text-brand-light/15" aria-hidden />
        )}
      </div>
    </ModalShell>
  );
}

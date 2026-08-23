'use client';

import Image from 'next/image';
import { Pencil, Megaphone } from 'lucide-react';
import type { Promo } from '@/types/database';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface PromoRowProps {
  promo: Promo;
  isPending: boolean;
  onToggleActive: (value: boolean) => void;
  onEdit: (promo: Promo) => void;
}

export function PromoRow({ promo, isPending, onToggleActive, onEdit }: PromoRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-brand-dark p-3 ring-1 ring-brand-primary/20 sm:gap-4">
      <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.06] sm:w-24">
        <Image src={promo.image_url} alt={promo.title} fill sizes="96px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-brand-light">{promo.title}</p>
        <p className="flex items-center gap-1 text-sm font-medium text-brand-light/50">
          <Megaphone className="size-3.5 shrink-0 text-brand-primary/70" aria-hidden />
          {promo.duration_seconds}s · orden {promo.display_order}
        </p>
      </div>
      <div className="shrink-0">
        <ToggleSwitch
          label="Activa"
          title="Las promociones inactivas se guardan en el catálogo pero no aparecen en el carrusel público."
          checked={promo.is_active}
          disabled={isPending}
          checkedClassName="bg-brand-accent"
          onChange={() => onToggleActive(!promo.is_active)}
        />
      </div>
      <button
        type="button"
        onClick={() => onEdit(promo)}
        aria-label={`Editar ${promo.title}`}
        className="shrink-0 rounded-full p-2 text-brand-light/40 transition-colors hover:bg-white/[0.07] hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
    </div>
  );
}

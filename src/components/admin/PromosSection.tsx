'use client';

import { useState } from 'react';
import { Plus, Megaphone } from 'lucide-react';
import type { Promo } from '@/types/database';
import { togglePromoActive } from '@/app/actions/promos';
import { PromoRow } from './PromoRow';
import { PromoFormModal } from './PromoFormModal';

interface PromosSectionProps {
  promos: Promo[];
  isPending: boolean;
  onToggleActive: (promoId: string, value: boolean) => void;
}

export function PromosSection({ promos, isPending, onToggleActive }: PromosSectionProps) {
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.16em] text-brand-light/35 uppercase">
          Flyers activos
        </h3>
        <button
          type="button"
          onClick={() => { setEditingPromo(null); setIsFormOpen(true); }}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-accent px-3.5 text-xs font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95"
        >
          <Plus className="size-4" aria-hidden />
          Nueva promoción
        </button>
      </div>

      {promos.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {promos.map((promo) => (
            <PromoRow
              key={promo.id}
              promo={promo}
              isPending={isPending}
              onToggleActive={(v) => onToggleActive(promo.id, v)}
              onEdit={setEditingPromo}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <Megaphone className="size-8 text-brand-light/15" aria-hidden />
          <p className="max-w-xs text-sm font-medium text-brand-light/40">
            Aún no hay promociones. Crea flyers que se mostrarán en el carrusel de la página principal.
          </p>
        </div>
      )}

      {isFormOpen && (
        <PromoFormModal
          promo={editingPromo}
          onClose={() => { setIsFormOpen(false); setEditingPromo(null); }}
        />
      )}
    </div>
  );
}

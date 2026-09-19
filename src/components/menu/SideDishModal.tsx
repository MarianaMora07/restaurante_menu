'use client';

import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { Dish } from '@/types/database';
import { cn } from '@/lib/utils';
import { ModalShell } from '@/components/ui/ModalShell';

interface SideDishModalProps {
  dish: Dish;
  availableSides: Dish[];
  onConfirm: (selected: { id: string; name: string; price: number }[]) => void;
  onSkip: () => void;
}

interface SideGroup {
  group: string;
  items: Dish[];
}

export function SideDishModal({ dish, availableSides, onConfirm, onSkip }: SideDishModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const groups = useMemo<SideGroup[]>(() => {
    const grouped = new Map<string, Dish[]>();
    for (const side of availableSides) {
      const key = side.side_dish_group || 'Otros';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(side);
    }
    return Array.from(grouped.entries()).map(([group, items]) => ({ group, items }));
  }, [availableSides]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const result = availableSides
      .filter((s) => selected.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, price: s.price }));
    onConfirm(result);
  }

  return (
    <ModalShell onClose={onSkip} label="Acompañar plato">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-primary uppercase">
            Acompañamientos
          </p>
          <h2 className="mt-0.5 font-heading text-base font-bold text-brand-light">
            Elige contornos para {dish.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Cerrar"
          className="rounded-full p-1.5 text-brand-light/40 transition-colors hover:bg-white/[0.07] hover:text-brand-light"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {groups.length > 0 ? (
          <div className="flex flex-col gap-5">
            {groups.map(({ group, items }) => (
              <div key={group}>
                <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.16em] text-brand-light/35 uppercase">
                  {group}
                </h3>
                <div className="flex flex-col gap-2">
                  {items.map((side) => {
                    const isActive = selected.has(side.id);
                    return (
                      <button
                        key={side.id}
                        type="button"
                        onClick={() => toggle(side.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3.5 py-3 text-left ring-1 transition-all',
                          isActive
                            ? 'bg-brand-accent/10 ring-brand-accent/40'
                            : 'bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-md ring-1 transition-all',
                            isActive
                              ? 'bg-brand-accent ring-brand-accent text-brand-darker'
                              : 'ring-white/20 text-transparent'
                          )}
                        >
                          <Check className="size-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-brand-light">{side.name}</span>
                          {side.description && (
                            <span className="mt-0.5 block text-[11px] text-brand-light/40 line-clamp-1">
                              {side.description}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-brand-primary">
                          +${side.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-brand-light/40">
            No hay contornos disponibles el día de hoy.
          </p>
        )}
      </div>

      <div className="flex gap-3 border-t border-white/10 px-5 py-4">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-xl bg-white/[0.07] py-3 text-sm font-semibold text-brand-light/70 transition-colors hover:bg-white/[0.12]"
        >
          Sin acompañamiento
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 rounded-xl bg-brand-accent py-3 text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Agregar {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </ModalShell>
  );
}

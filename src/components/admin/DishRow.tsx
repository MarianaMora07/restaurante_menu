'use client';

import Image from 'next/image';
import { Pencil, UtensilsCrossed } from 'lucide-react';
import type { Dish } from '@/types/database';
import { cn, formatPrice } from '@/lib/utils';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface DishRowProps {
  dish: Dish;
  isPending: boolean;
  onToggleAvailability: (value: boolean) => void;
  onToggleDailyMenu: (value: boolean) => void;
  onEdit: (dish: Dish) => void;
}

export function DishRow({
  dish,
  isPending,
  onToggleAvailability,
  onToggleDailyMenu,
  onEdit,
}: DishRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-brand-dark p-3 ring-1 ring-brand-primary/20 sm:gap-4">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.06] sm:size-16">
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            sizes="64px"
            className={cn('object-cover', !dish.is_available && 'opacity-60 grayscale')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-light/20">
            <UtensilsCrossed className="size-6" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-brand-light">{dish.name}</p>
        <p className="text-sm font-medium text-brand-primary">{formatPrice(dish.price)}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <ToggleSwitch
          label="Agotado"
          title="Desactivar esta opción mostrará el plato con la insignia 'Agotado' en la vista pública sin eliminarlo del catálogo."
          checked={!dish.is_available}
          disabled={isPending}
          checkedClassName="bg-red-500"
          onChange={() => onToggleAvailability(!dish.is_available)}
        />
        <ToggleSwitch
          label="Menú del Día"
          title="Al activar esta opción, el plato aparecerá destacado en la sección especial 'Menú del Día' de la vista pública."
          checked={dish.is_daily_menu}
          disabled={isPending}
          checkedClassName="bg-brand-accent"
          onChange={() => onToggleDailyMenu(!dish.is_daily_menu)}
        />
      </div>
      <button
        type="button"
        onClick={() => onEdit(dish)}
        aria-label={`Editar ${dish.name}`}
        className="shrink-0 rounded-full p-2 text-brand-light/40 transition-colors hover:bg-white/[0.07] hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <Pencil className="size-4" aria-hidden />
      </button>
    </div>
  );
}

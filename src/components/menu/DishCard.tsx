'use client';

import Image from 'next/image';
import { Plus, UtensilsCrossed } from 'lucide-react';
import type { Dish, UsdRateInfo } from '@/types/database';
import { cn } from '@/lib/utils';
import { DualPrice } from '@/components/ui/DualPrice';
import { useCart } from './CartContext';

interface DishCardProps {
  dish: Dish;
  rate: UsdRateInfo | null;
  onOpen: (dish: Dish) => void;
}

export function DishCard({ dish, rate, onOpen }: DishCardProps) {
  const soldOut = !dish.is_available;
  const { addDish } = useCart();

  return (
    <div className="group flex w-full flex-col overflow-hidden rounded-2xl bg-brand-dark shadow-elevated ring-1 ring-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:ring-brand-primary/30 focus-within:ring-brand-primary/50">
      <button
        type="button"
        onClick={() => onOpen(dish)}
        aria-label={`Ver detalles de ${dish.name}`}
        className="flex flex-1 cursor-pointer flex-col text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-primary active:scale-[0.97]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.04]">
          {dish.image_url ? (
            <Image
              src={dish.image_url}
              alt={dish.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={cn(
                'object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-active:scale-105',
                soldOut && 'opacity-60 grayscale'
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-light/15">
              <UtensilsCrossed className="size-10" aria-hidden />
            </div>
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-brand-dark/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          {(dish.is_daily_menu || soldOut) && (
            <div className="absolute top-3 left-3 flex gap-2">
              {dish.is_daily_menu && !soldOut && (
                <span className="rounded-full bg-linear-to-r from-brand-accent to-brand-primary px-3 py-1 font-heading text-xs font-bold text-brand-darker shadow-glow-accent">
                  Menú del Día
                </span>
              )}
              {soldOut && (
                <span className="rounded-full bg-zinc-500/25 px-3 py-1 font-heading text-xs font-semibold tracking-wide text-zinc-200 ring-1 ring-white/20 backdrop-blur-sm">
                  Agotado
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
          <h3 className="font-heading leading-snug font-bold text-brand-light">
            {dish.name}
          </h3>
          {dish.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-brand-light/55">
              {dish.description}
            </p>
          )}
        </div>
      </button>
      <div className="flex items-center justify-between gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
        <DualPrice
          amount={dish.price}
          rate={rate}
          className="shrink-0 font-heading font-bold text-brand-primary"
        />
        <button
          type="button"
          onClick={() => addDish(dish)}
          disabled={soldOut}
          aria-label={`Agregar ${dish.name} al pedido`}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r from-brand-accent to-brand-primary px-3.5 font-heading text-xs font-bold text-brand-darker shadow-glow-accent transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          <Plus className="size-4" aria-hidden />
          Agregar
        </button>
      </div>
    </div>
  );
}

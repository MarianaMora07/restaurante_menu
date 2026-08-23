import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import type { Dish } from '@/types/database';
import { cn, formatPrice } from '@/lib/utils';

interface DishCardProps {
  dish: Dish;
  onOpen: (dish: Dish) => void;
}

export function DishCard({ dish, onOpen }: DishCardProps) {
  const soldOut = !dish.is_available;

  return (
    <button
      type="button"
      onClick={() => onOpen(dish)}
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-brand-dark text-left shadow-elevated ring-1 ring-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:ring-brand-primary/30 active:scale-[0.97] active:ring-brand-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
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
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-dark/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {(dish.is_daily_menu || soldOut) && (
          <div className="absolute top-3 left-3 flex gap-2">
            {dish.is_daily_menu && !soldOut && (
              <span className="rounded-full bg-gradient-to-r from-brand-accent to-brand-primary px-3 py-1 font-heading text-xs font-bold text-brand-darker shadow-glow-accent">
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
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading leading-snug font-bold text-brand-light">
            {dish.name}
          </h3>
          <span className="shrink-0 font-heading font-bold text-brand-primary">
            {formatPrice(dish.price)}
          </span>
        </div>
        {dish.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-brand-light/55">
            {dish.description}
          </p>
        )}
      </div>
    </button>
  );
}

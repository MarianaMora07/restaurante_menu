'use client';

import Image from 'next/image';
import { Check, Plus, UtensilsCrossed, X } from 'lucide-react';
import type { Dish, UsdRateInfo } from '@/types/database';
import { ModalShell } from '@/components/ui/ModalShell';
import { DualPrice } from '@/components/ui/DualPrice';
import { WhatsAppButton } from './WhatsAppButton';
import { useCart } from './CartContext';

interface DishModalProps {
  dish: Dish | null;
  rate?: UsdRateInfo | null;
  onClose: () => void;
  onRequestAdd?: (dish: Dish) => void;
}

export function DishModal({ dish, rate = null, onClose, onRequestAdd }: DishModalProps) {
  const { addDish } = useCart();
  if (!dish) return null;
  const currentDish = dish;

  function handleAdd() {
    if (onRequestAdd) onRequestAdd(currentDish);
    else addDish(currentDish);
  }

  return (
    <ModalShell onClose={onClose} aria-label={dish.name}>
      <div className="relative aspect-[16/10] w-full shrink-0 bg-white/[0.04]">
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            sizes="(min-width: 640px) 512px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-light/15">
            <UtensilsCrossed className="size-14" aria-hidden />
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-dark to-transparent"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha del plato"
          className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white ring-1 ring-white/15 backdrop-blur-sm transition-all hover:scale-105 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:scale-95"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-5 overflow-y-auto p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl leading-snug font-bold text-brand-light sm:text-2xl">
            {dish.name}
          </h2>
          <DualPrice
            amount={dish.price}
            rate={rate}
            className="shrink-0 font-heading text-lg font-bold text-brand-primary"
          />
        </div>
        {dish.description && (
          <p className="text-sm leading-relaxed text-brand-light/65">
            {dish.description}
          </p>
        )}
        {dish.ingredients.length > 0 && (
          <section aria-label="Ingredientes">
            <h3 className="mb-2.5 font-heading text-xs font-semibold tracking-[0.18em] text-brand-light/40 uppercase">
              Ingredientes
            </h3>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {dish.ingredients.map((ingredient) => (
                <li
                  key={ingredient}
                  className="flex items-center gap-2 text-sm text-brand-light/75"
                >
                  <Check className="size-4 shrink-0 text-brand-primary" aria-hidden />
                  {ingredient}
                </li>
              ))}
            </ul>
          </section>
        )}
        {!dish.is_available && (
          <p className="rounded-xl bg-brand-accent/10 px-4 py-3 text-sm font-medium text-brand-accent ring-1 ring-brand-accent/20">
            Este plato está agotado actualmente.
          </p>
        )}
        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!dish.is_available}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent to-brand-primary font-heading font-bold text-brand-darker shadow-elevated transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <Plus className="size-5" aria-hidden />
            Agregar al pedido
          </button>
          <WhatsAppButton
            dishName={dish.name}
            className="rounded-xl bg-white/[0.07] text-[#4ADE80] shadow-elevated ring-1 ring-[#25D366]/40 hover:bg-white/[0.12] hover:text-[#86EFAC]"
          />
        </div>
      </div>
    </ModalShell>
  );
}

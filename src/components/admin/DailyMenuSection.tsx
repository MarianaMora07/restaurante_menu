'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, CalendarDays, Download, Image as ImageIcon, Loader2, Salad } from 'lucide-react';
import type { Category, Dish, UsdRateInfo } from '@/types/database';
import { DualPrice } from '@/components/ui/DualPrice';
import { siteConfig } from '@/config/site';

interface DailyMenuSectionProps {
  categories: Category[];
  dishes: Dish[];
  rate: UsdRateInfo | null;
}

const CATEGORY_ORDER: Record<string, number> = {
  contornos: 900,
  bebidas: 950,
  postres: 1000,
};

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const aKey = a.name.toLowerCase();
    const bKey = b.name.toLowerCase();
    const aOrder = CATEGORY_ORDER[aKey] ?? a.display_order;
    const bOrder = CATEGORY_ORDER[bKey] ?? b.display_order;
    return aOrder - bOrder;
  });
}

export function DailyMenuSection({ categories, dishes, rate }: DailyMenuSectionProps) {
  const dailyMain = useMemo(
    () => dishes.filter((d) => d.is_daily_menu && d.is_available && !d.is_side_dish),
    [dishes]
  );
  const dailySides = useMemo(
    () => dishes.filter((d) => d.is_side_dish && d.is_daily_menu && d.is_available),
    [dishes]
  );

  const groupedByCategory = useMemo(() => {
    const sorted = sortCategories(categories);
    const groups: { category: Category; dishes: Dish[] }[] = [];
    for (const cat of sorted) {
      const items = dailyMain.filter((d) => d.category_id === cat.id);
      if (items.length > 0) groups.push({ category: cat, dishes: items });
    }
    const knownIds = new Set(categories.map((c) => c.id));
    const orphans = dailyMain.filter((d) => !knownIds.has(d.category_id));
    if (orphans.length > 0) {
      groups.push({ category: { id: 'orphans', name: 'Otros', slug: 'otros', display_order: 999, parent_id: null }, dishes: orphans });
    }
    return groups;
  }, [categories, dailyMain]);

  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const today = new Intl.DateTimeFormat('es-VE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  async function handleDownloadImage() {
    if (!previewRef.current) return;
    setIsGenerating(true);
    setDlError(null);
    try {
      const { domToCanvas } = await import('modern-screenshot');
      const canvas = await domToCanvas(previewRef.current, {
        backgroundColor: '#260101',
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `menu-del-dia-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generando imagen:', err);
      setDlError('No se pudo generar la imagen. Intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  }

  const hasContent = dailyMain.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.16em] text-brand-light/35 uppercase">
            Platos del día ({dailyMain.length}){dailySides.length > 0 ? ` · Contornos (${dailySides.length})` : ''}
          </h3>
          <p className="mt-1 text-xs text-brand-light/40">
            Marca platos como &quot;Menú del Día&quot; en la sección Menú.
          </p>
        </div>
        {hasContent && (
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-accent px-3.5 text-xs font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {isGenerating ? 'Generando...' : 'Descargar'}
          </button>
        )}
      </div>

      {dlError && (
        <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30">
          {dlError}
        </p>
      )}

      {hasContent ? (
        <div ref={previewRef} className="overflow-hidden rounded-2xl bg-brand-darker ring-1 ring-brand-primary/20">
          {/* Header */}
          <div className="border-b border-brand-primary/15 bg-brand-dark/60 px-8 py-6 text-center">
            <p className="font-display text-2xl font-bold tracking-tight text-brand-primary">
              {siteConfig.name}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 text-brand-light/50">
              <CalendarDays className="size-4" aria-hidden />
              <span className="text-sm font-medium capitalize">{today}</span>
            </div>
            <p className="mt-3 font-heading text-xs font-bold tracking-[0.25em] text-brand-accent/80 uppercase">
              Menú del Día
            </p>
          </div>

          {/* Categorías agrupadas */}
          {groupedByCategory.map(({ category, dishes: catDishes }) => (
            <div key={category.id} className="px-8 py-5">
              <h4 className="mb-4 font-heading text-[11px] font-bold tracking-[0.2em] text-brand-primary/60 uppercase">
                {category.name}
              </h4>
              <div className="flex flex-col gap-5">
                {catDishes.map((dish) => (
                  <article key={dish.id} className="flex flex-col gap-3">
                    <div className="flex gap-4">
                      {dish.image_url && (
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.06] sm:size-24">
                          <Image
                            src={dish.image_url}
                            alt={dish.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="font-heading text-base font-bold text-brand-light">
                            {dish.name}
                          </h5>
                          <DualPrice
                            amount={dish.price}
                            rate={rate}
                            align="end"
                            className="shrink-0 text-sm font-bold text-brand-primary"
                          />
                        </div>
                        {dish.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-brand-light/60">
                            {dish.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {dish.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-0 sm:pl-24">
                        {dish.ingredients.map((ing) => (
                          <span
                            key={ing}
                            className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-brand-light/55 ring-1 ring-white/[0.08]"
                          >
                            <Check className="size-3 shrink-0 text-brand-primary/70" aria-hidden />
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}

          {/* Contornos disponibles */}
          {dailySides.length > 0 && (
            <div className="border-t border-white/5 bg-brand-dark/30 px-8 py-5">
              <div className="mb-3 flex items-center gap-2">
                <Salad className="size-4 text-brand-primary/60" aria-hidden />
                <h4 className="font-heading text-[11px] font-bold tracking-[0.2em] text-brand-primary/60 uppercase">
                  Contornos Disponibles
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {dailySides.map((side) => (
                  <div key={side.id} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-white/[0.05]">
                    {side.image_url && (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                        <Image
                          src={side.image_url}
                          alt={side.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-light">{side.name}</p>
                      {side.side_dish_group && (
                        <p className="text-[10px] text-brand-light/35">{side.side_dish_group}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-brand-primary">
                      +${side.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-white/5 bg-brand-dark/40 px-8 py-4 text-center">
            <p className="text-[11px] text-brand-light/35">
              Precios en USD ·{' '}
              {rate
                ? `Tasa: Bs. ${rate.rate.toFixed(2)} / USD (${rate.source === 'bcv' ? 'BCV' : 'Personalizada'})`
                : 'Tasa no disponible'}{' '}
              · {siteConfig.name}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <ImageIcon className="size-8 text-brand-light/15" aria-hidden />
          <p className="max-w-xs text-sm font-medium text-brand-light/40">
            No hay platos marcados como &quot;Menú del Día&quot;. Activa el toggle en la sección de Menú.
          </p>
        </div>
      )}
    </div>
  );
}

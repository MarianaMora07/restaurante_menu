'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, CalendarDays, Download, Image as ImageIcon, Loader2, Palette, Trash2, Upload } from 'lucide-react';
import type { DailyMenuPdfDish, DailyMenuPdfSection } from '@/lib/daily-menu-pdf';
import type { Category, Dish, UsdRateInfo } from '@/types/database';
import { DualPrice } from '@/components/ui/DualPrice';
import { siteConfig } from '@/config/site';
import { uploadImage } from '@/app/actions/storage';
import { saveMenuTemplate, deleteMenuTemplate } from '@/app/actions/settings';
import { compressToWebp } from '@/lib/image-compress';

interface DailyMenuSectionProps {
  categories: Category[];
  dishes: Dish[];
  rate: UsdRateInfo | null;
  menuTemplate: string | null;
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

export function DailyMenuSection({ categories, dishes, rate, menuTemplate }: DailyMenuSectionProps) {
  const router = useRouter();
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

    const BOTTOM = ['bebidas', 'postres'];
    const main = groups.filter(
      (g) => !BOTTOM.includes(g.category.name.toLowerCase()) && g.category.name.toLowerCase() !== 'contornos'
    );
    const bottom = groups.filter(
      (g) => BOTTOM.includes(g.category.name.toLowerCase())
    );
    return [...main, ...bottom];
  }, [categories, dailyMain]);

  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const templateFileRef = useRef<HTMLInputElement>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  async function handleTemplateUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setTemplateError(null);

    if (!file.type.startsWith('image/')) {
      setTemplateError('El archivo debe ser una imagen (PNG o JPG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setTemplateError('La imagen no debe superar 5 MB.');
      return;
    }

    setIsUploadingTemplate(true);
    try {
      // Convertir a WebP comprimido antes de subir
      const { file: compressedFile } = await compressToWebp(file);
      const formData = new FormData();
      formData.set('file', compressedFile);
      const upload = await uploadImage('menu-templates', formData);
      if (!upload.success || !upload.url) {
        setTemplateError(upload.error ?? 'No se pudo subir la plantilla.');
        return;
      }
      const save = await saveMenuTemplate(upload.url);
      if (!save.success) {
        setTemplateError(save.error ?? 'No se pudo guardar la plantilla.');
        return;
      }
      router.refresh();
    } catch {
      setTemplateError('Error inesperado al subir la plantilla.');
    } finally {
      setIsUploadingTemplate(false);
      if (templateFileRef.current) templateFileRef.current.value = '';
    }
  }

  async function handleTemplateDelete() {
    setTemplateError(null);
    setIsUploadingTemplate(true);
    try {
      const result = await deleteMenuTemplate();
      if (!result.success) {
        setTemplateError(result.error ?? 'No se pudo quitar la plantilla.');
        return;
      }
      router.refresh();
    } catch {
      setTemplateError('Error inesperado al quitar la plantilla.');
    } finally {
      setIsUploadingTemplate(false);
    }
  }

  const today = new Intl.DateTimeFormat('es-VE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  async function handleDownloadImage() {
    setIsGenerating(true);
    setDlError(null);
    try {
      const { buildDailyMenuPdf } = await import('@/lib/daily-menu-pdf');

      async function loadImageAsBase64(url: string): Promise<string | null> {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      }

      const imageById = new Map<string, string>();
      await Promise.all(
        dailyMain.map(async (dish) => {
          if (!dish.image_url) return;
          const data = await loadImageAsBase64(dish.image_url);
          if (data) imageById.set(dish.id, data);
        }),
      );

      const templateDataUrl = menuTemplate ? await loadImageAsBase64(menuTemplate) : null;

      function toPdfDish(dish: Dish, withImage: boolean): DailyMenuPdfDish {
        return {
          name: dish.name,
          price: dish.price,
          description: dish.description,
          ingredients: dish.ingredients,
          imageDataUrl: withImage ? (imageById.get(dish.id) ?? null) : null,
        };
      }

      const sideGroups = new Map<string, typeof dailySides>();
      for (const side of dailySides) {
        const group = side.side_dish_group || 'Otros';
        const list = sideGroups.get(group) ?? [];
        list.push(side);
        sideGroups.set(group, list);
      }

      const BOTTOM_CATEGORIES = ['bebidas', 'postres'];
      const mainGroups = groupedByCategory.filter(
        (g) => !BOTTOM_CATEGORIES.includes(g.category.name.toLowerCase()) && g.category.name.toLowerCase() !== 'contornos',
      );
      const bottomGroups = groupedByCategory.filter((g) =>
        BOTTOM_CATEGORIES.includes(g.category.name.toLowerCase()),
      );

      const sections: DailyMenuPdfSection[] = [];
      for (const group of [...mainGroups, ...bottomGroups]) {
        sections.push({
          title: group.category.name,
          layout: 'cards',
          groups: [{ name: group.category.name, dishes: group.dishes.map((dish) => toPdfDish(dish, true)) }],
        });
      }
      if (dailySides.length > 0) {
        sections.push({
          title: 'Contornos',
          layout: 'grid',
          groups: Array.from(sideGroups.entries()).map(([name, sides]) => ({
            name,
            dishes: sides.map((dish) => toPdfDish(dish, false)),
          })),
        });
      }

      const rateNote = rate
        ? `Tasa: Bs. ${rate.rate.toFixed(2)} / USD (${rate.source === 'bcv' ? 'BCV' : 'Personalizada'})`
        : 'Tasa no disponible';
      const dateLabel = today.charAt(0).toUpperCase() + today.slice(1);

      const doc = buildDailyMenuPdf({
        restaurantName: siteConfig.name,
        dateLabel,
        rateNote,
        templateDataUrl,
        sections,
      });

      doc.save(`menu-del-dia-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      setDlError('No se pudo generar el PDF. Intenta de nuevo.');
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

      {/* Gestión de plantilla PNG */}
      <div className="rounded-2xl bg-brand-dark p-4 ring-1 ring-brand-primary/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 ring-1 ring-brand-primary/20">
              <Palette className="size-4 text-brand-primary" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold text-brand-light/70">Plantilla del PDF</p>
              <p className="text-[11px] text-brand-light/40">
                {menuTemplate ? 'Plantilla activa — se usa como fondo del PDF.' : 'Diseña un PNG en Canva (carta, 216×279 mm) y súbelo como fondo.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {menuTemplate && (
              <div className="relative size-10 overflow-hidden rounded-lg ring-1 ring-white/10">
                <Image src={menuTemplate} alt="Plantilla" fill sizes="40px" className="object-cover" />
              </div>
            )}
            <input
              ref={templateFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleTemplateUpload}
            />
            <button
              type="button"
              onClick={() => templateFileRef.current?.click()}
              disabled={isUploadingTemplate}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-primary/15 px-3 text-[11px] font-bold text-brand-primary ring-1 ring-brand-primary/25 transition-all hover:bg-brand-primary/25 disabled:opacity-50"
            >
              {isUploadingTemplate ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-3" aria-hidden />
              )}
              {menuTemplate ? 'Cambiar' : 'Subir PNG'}
            </button>
            {menuTemplate && (
              <button
                type="button"
                onClick={handleTemplateDelete}
                disabled={isUploadingTemplate}
                className="flex h-8 items-center gap-1 rounded-lg bg-red-500/10 px-2.5 text-[11px] font-bold text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 disabled:opacity-50"
              >
                <Trash2 className="size-3" aria-hidden />
              </button>
            )}
          </div>
        </div>
        {templateError && (
          <p role="alert" className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-[11px] font-medium text-red-300 ring-1 ring-red-500/30">
            {templateError}
          </p>
        )}
        {menuTemplate && (
          <p className="mt-2 text-[10px] leading-relaxed text-brand-light/30">
            Diseña en Canva con tamaño <strong className="text-brand-light/50">Carta (216×279 mm)</strong>. El sistema dibujará los platos en el centro;
            deja espacios libres arriba (encabezado) y abajo (pie) sin texto importante.
          </p>
        )}
      </div>

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
          {groupedByCategory.map(({ category, dishes: catDishes }, catIdx) => (
            <div key={category.id}>
              {catIdx > 0 && <div className="mx-8 border-t border-brand-primary/10" />}
              <div className="px-8 py-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-block rounded-full bg-brand-primary/15 px-3 py-1 font-heading text-[10px] font-bold tracking-[0.2em] text-brand-primary uppercase">
                    {category.name}
                  </span>
                  <span className="text-[10px] text-brand-light/25">{catDishes.length} {catDishes.length === 1 ? 'plato' : 'platos'}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {catDishes.map((dish) => (
                    <article key={dish.id} className="flex flex-col gap-2.5">
                      <div className="flex gap-4">
                        {dish.image_url && (
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white/[0.06] sm:size-20">
                            <Image
                              src={dish.image_url}
                              alt={dish.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="font-heading text-sm font-bold text-brand-light sm:text-base">
                              {dish.name}
                            </h5>
                            <DualPrice
                              amount={dish.price}
                              rate={rate}
                              align="end"
                              className="shrink-0 text-xs font-bold text-brand-primary sm:text-sm"
                            />
                          </div>
                          {dish.description && (
                            <p className="mt-1 text-xs leading-relaxed text-brand-light/55 sm:text-sm">
                              {dish.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {dish.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:pl-20">
                          {dish.ingredients.map((ing) => (
                            <span
                              key={ing}
                              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-brand-light/50 ring-1 ring-white/[0.06]"
                            >
                              <Check className="size-2.5 shrink-0 text-brand-primary/60" aria-hidden />
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Contornos disponibles */}
          {dailySides.length > 0 && (
            <>
              <div className="mx-8 border-t border-brand-primary/10" />
              <div className="px-8 py-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-block rounded-full bg-brand-primary/15 px-3 py-1 font-heading text-[10px] font-bold tracking-[0.2em] text-brand-primary uppercase">
                    Contornos
                  </span>
                  <span className="text-[10px] text-brand-light/25">{dailySides.length} disponible{dailySides.length !== 1 ? 's' : ''}</span>
                </div>
                {(() => {
                  const sideGroups = new Map<string, typeof dailySides>();
                  for (const side of dailySides) {
                    const group = side.side_dish_group || 'Otros';
                    const list = sideGroups.get(group) ?? [];
                    list.push(side);
                    sideGroups.set(group, list);
                  }
                  return Array.from(sideGroups.entries()).map(([groupName, sides], idx) => (
                    <div key={groupName} className={idx > 0 ? 'mt-4' : ''}>
                      <p className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-brand-light/30 uppercase">
                        {groupName}
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {sides.map((side) => (
                          <div key={side.id} className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2 ring-1 ring-white/[0.04]">
                            {side.image_url && (
                              <div className="relative size-8 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
                                <Image
                                  src={side.image_url}
                                  alt={side.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-brand-light sm:text-sm">
                              {side.name}
                            </span>
                            <span className="shrink-0 text-[11px] font-bold text-brand-primary">
                              +${side.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </>
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

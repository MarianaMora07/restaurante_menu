'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { Trash2, X } from 'lucide-react';
import type { Promo } from '@/types/database';
import { deletePromo, savePromo } from '@/app/actions/promos';
import { generatePromoDescription } from '@/app/actions/ai-description';
import { uploadImage } from '@/app/actions/storage';
import {
  checkboxRowClasses,
  Field,
  inputClasses,
} from '@/components/ui/formStyles';
import { AiDescriptionField } from '@/components/ui/AiDescriptionField';
import { ModalShell } from '@/components/ui/ModalShell';

interface PromoFormModalProps {
  promo: Promo | null;
  onClose: () => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function PromoFormModal({ promo, onClose }: PromoFormModalProps) {
  const [title, setTitle] = useState(promo?.title ?? '');
  const [description, setDescription] = useState(promo?.description ?? '');
  const [duration, setDuration] = useState(String(promo?.duration_seconds ?? 6));
  const [order, setOrder] = useState(String(promo?.display_order ?? 0));
  const [isActive, setIsActive] = useState(promo?.is_active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(promo?.image_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  async function handleGenerateDescription() {
    if (!title.trim() || isGeneratingDescription) return;
    setIsGeneratingDescription(true);
    setError(null);

    const result = await generatePromoDescription(title);
    setIsGeneratingDescription(false);

    if (!result.success || !result.description) {
      setError(result.error ?? 'No se pudo generar la descripción con IA.');
      return;
    }
    setDescription(result.description);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError('La imagen no debe superar los 5 MB.');
      return;
    }
    setError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) return setError('El título de la promoción es obligatorio.');

    setIsSubmitting(true);
    try {
      let imageUrl = promo?.image_url ?? null;
      if (file) {
        const formData = new FormData();
        formData.set('file', file);
        const upload = await uploadImage('promos-images', formData);
        if (!upload.success || !upload.url) {
          setError(upload.error ?? 'No se pudo subir la imagen.');
          setIsSubmitting(false);
          return;
        }
        imageUrl = upload.url;
      }
      if (!imageUrl) {
        setError('Selecciona una imagen para la promoción.');
        setIsSubmitting(false);
        return;
      }

      const result = await savePromo({
        id: promo?.id,
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
        duration_seconds: Math.min(30, Math.max(3, Number(duration) || 6)),
        display_order: Math.max(0, Number(order) || 0),
        is_active: isActive,
      });

      if (!result.success) {
        setError(result.error ?? 'No se pudo guardar la promoción.');
        setIsSubmitting(false);
        return;
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!promo || !window.confirm(`¿Eliminar "${promo.title}" permanentemente?`)) return;

    setIsSubmitting(true);
    const result = await deletePromo(promo.id);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo eliminar la promoción.');
      return;
    }
    onClose();
  }

  return (
    <ModalShell
      onClose={onClose}
      label={promo ? `Editando ${promo.title}` : 'Nueva promoción'}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-primary uppercase">
            {promo ? 'Editando promoción' : 'Nuevo flyer'}
          </p>
          <h2 className="mt-0.5 font-heading text-lg leading-snug font-bold text-brand-light">
            {promo
              ? `Editando Promoción: ${promo.title}`
              : 'Añadir Flyer / Promoción Interactiva'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar formulario"
          className="rounded-full p-2 text-brand-light/40 transition-colors hover:bg-white/[0.07] hover:text-brand-light"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto p-6">
        <Field
          label="Imagen del flyer"
          hint="Sube la imagen del flyer que se mostrará en el carrusel de promociones."
        >
          <label className="group relative block aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/15 transition-colors hover:ring-brand-accent/50">
            {previewUrl ? (
              <Image src={previewUrl} alt="Vista previa" fill sizes="512px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-sm text-brand-light/55">
                Haz clic para subir una imagen
              </span>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
          </label>
        </Field>

        <Field label="Título">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: 2x1 en Pizzas los viernes"
            required
            className={inputClasses}
          />
        </Field>

        <AiDescriptionField
          value={description}
          onChange={setDescription}
          onGenerate={handleGenerateDescription}
          isGenerating={isGeneratingDescription}
          canGenerate={title.trim().length > 0}
          disabled={isSubmitting}
          rows={2}
          placeholder="Detalle breve de la oferta…"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Duración en pantalla"
            hint="Segundos visibles antes de pasar a la siguiente (3–30)."
          >
            <input
              type="number"
              inputMode="numeric"
              min="3"
              max="30"
              step="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClasses}
            />
          </Field>
          <Field label="Orden de aparición" hint="Menor número aparece primero.">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className={inputClasses}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07] select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className={checkboxRowClasses}
          />
          <span>
            <span className="block text-sm font-semibold text-brand-light">
              Promoción visible en el sitio
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-brand-light/50">
              Las promociones inactivas se guardan en el catálogo pero no aparecen en el carrusel
              público.
            </span>
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300 ring-1 ring-red-500/30"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          {promo ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden />
              Eliminar
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-xl bg-brand-accent px-6 font-heading text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            {isSubmitting ? 'Guardando…' : promo ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

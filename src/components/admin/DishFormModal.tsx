'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { Trash2, X } from 'lucide-react';
import type { Category, Dish } from '@/types/database';
import { deleteDish, saveDish } from '@/app/actions/dishes';
import { generateDishDescription } from '@/app/actions/ai-description';
import { uploadImage } from '@/app/actions/storage';
import {
  checkboxRowClasses,
  Field,
  inputClasses,
  selectClasses,
} from '@/components/ui/formStyles';
import { AiDescriptionField } from '@/components/ui/AiDescriptionField';
import { ModalShell } from '@/components/ui/ModalShell';

interface DishFormModalProps {
  dish: Dish | null;
  categories: Category[];
  onClose: () => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function DishFormModal({ dish, categories, onClose }: DishFormModalProps) {
  const [name, setName] = useState(dish?.name ?? '');
  const [categoryId, setCategoryId] = useState(dish?.category_id ?? '');
  const [price, setPrice] = useState(dish ? String(dish.price) : '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [ingredients, setIngredients] = useState<string[]>(dish?.ingredients ?? []);
  const [ingredientInput, setIngredientInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(dish?.is_available ?? true);
  const [isDailyMenu, setIsDailyMenu] = useState(dish?.is_daily_menu ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(dish?.image_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  async function handleGenerateDescription() {
    if (!name.trim() || isGeneratingDescription) return;
    setIsGeneratingDescription(true);
    setError(null);

    const result = await generateDishDescription(name);
    setIsGeneratingDescription(false);

    if (!result.success || !result.description) {
      setError(result.error ?? 'No se pudo generar la descripción con IA.');
      return;
    }
    setDescription(result.description);
  }

  function addIngredient(raw: string) {
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setIngredients((prev) => [...new Set([...prev, ...parts])]);
    setIngredientInput('');
  }

  function removeIngredient(ingredient: string) {
    setIngredients((prev) => prev.filter((item) => item !== ingredient));
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

    const priceValue = Number(price);
    if (!name.trim()) return setError('El nombre del plato es obligatorio.');
    if (!categoryId) return setError('Selecciona una categoría.');
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      return setError('Ingresa un precio válido.');
    }

    setIsSubmitting(true);
    try {
      let imageUrl = dish?.image_url ?? null;
      if (file) {
        const formData = new FormData();
        formData.set('file', file);
        const upload = await uploadImage('dishes-images', formData);
        if (!upload.success || !upload.url) {
          setError(upload.error ?? 'No se pudo subir la imagen.');
          setIsSubmitting(false);
          return;
        }
        imageUrl = upload.url;
      }

      const result = await saveDish({
        id: dish?.id,
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        ingredients,
        price: priceValue,
        image_url: imageUrl,
        is_available: isAvailable,
        is_daily_menu: isDailyMenu,
        is_side_dish: dish?.is_side_dish ?? false,
        side_dish_group: dish?.side_dish_group ?? null,
      });

      if (!result.success) {
        setError(result.error ?? 'No se pudo guardar el plato.');
        setIsSubmitting(false);
        return;
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!dish || !window.confirm(`¿Eliminar "${dish.name}" permanentemente?`)) return;

    setIsSubmitting(true);
    const result = await deleteDish(dish.id);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo eliminar el plato.');
      return;
    }
    onClose();
  }

  return (
    <ModalShell
      onClose={onClose}
      label={dish ? `Editando ${dish.name}` : 'Nuevo platillo'}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-primary uppercase">
            {dish ? 'Editando platillo' : 'Nuevo registro'}
          </p>
          <h2 className="mt-0.5 font-heading text-lg leading-snug font-bold text-brand-light">
            {dish ? `Editando Platillo: ${dish.name}` : 'Crear Nuevo Platillo para el Menú'}
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
          label="Imagen del platillo"
          hint="Sube una imagen representativa para la ficha del platillo."
        >
          <span className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/15 transition-colors hover:ring-brand-accent/50">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Vista previa del platillo"
                fill
                sizes="512px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-sm text-brand-light/55">
                Haz clic para subir una imagen
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </span>
        </Field>

        <Field label="Nombre">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Pasta Carbonara"
            required
            className={inputClasses}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Categoría">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className={selectClasses}
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Precio">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
              className={inputClasses}
            />
          </Field>
        </div>

        <AiDescriptionField
          value={description}
          onChange={setDescription}
          onGenerate={handleGenerateDescription}
          isGenerating={isGeneratingDescription}
          canGenerate={name.trim().length > 0}
          disabled={isSubmitting}
          placeholder="Descripción breve del plato…"
        />

        <Field
          label="Ingredientes"
          hint="Escribe los ingredientes separados por comas. Se mostrarán como etiquetas visuales en la ficha del plato."
        >
          <input
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addIngredient(ingredientInput);
              }
            }}
            onBlur={() => addIngredient(ingredientInput)}
            placeholder="Ej: pasta, huevo, parmesano, panceta"
            className={inputClasses}
          />
          {ingredients.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {ingredients.map((ingredient) => (
                <li key={ingredient}>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingredient)}
                    className="flex items-center gap-1 rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-brand-light ring-1 ring-white/10 transition-colors hover:bg-red-500/15 hover:text-red-300 hover:ring-red-500/30"
                  >
                    {ingredient}
                    <X className="size-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <fieldset className="flex flex-col gap-4 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
          <legend className="px-1 font-heading text-xs font-semibold tracking-[0.14em] text-brand-light/60 uppercase">
            Estado en la vista pública
          </legend>
          <label className="flex cursor-pointer items-start gap-3 select-none">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className={checkboxRowClasses}
            />
            <span>
              <span className="block text-sm font-semibold text-brand-light">Disponible</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-brand-light/50">
                Desactivar esta opción mostrará el plato con la insignia &quot;Agotado&quot; en
                la vista pública sin eliminarlo del catálogo.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 select-none">
            <input
              type="checkbox"
              checked={isDailyMenu}
              onChange={(e) => setIsDailyMenu(e.target.checked)}
              className={checkboxRowClasses}
            />
            <span>
              <span className="block text-sm font-semibold text-brand-light">Menú del Día</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-brand-light/50">
                Al activar esta opción, el plato aparecerá destacado en la sección especial
                &quot;Menú del Día&quot; de la vista pública.
              </span>
            </span>
          </label>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300 ring-1 ring-red-500/30"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          {dish ? (
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
            {isSubmitting ? 'Guardando…' : dish ? 'Guardar cambios' : 'Crear platillo'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, FolderTree, X } from 'lucide-react';
import type { Category } from '@/types/database';
import { saveCategory, deleteCategory } from '@/app/actions/categories';
import { inputClasses, Field } from '@/components/ui/formStyles';
import { ModalShell } from '@/components/ui/ModalShell';

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  function handleDelete(cat: Category) {
    if (!window.confirm(`¿Eliminar "${cat.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(cat.id);
      if (!result.success) setError(result.error ?? 'No se pudo eliminar.');
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.16em] text-brand-light/35 uppercase">
          {categories.length} categoría{categories.length !== 1 && 's'}
        </h3>
        <button
          type="button"
          onClick={() => { setEditing(null); setIsFormOpen(true); }}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-brand-accent px-3.5 text-xs font-bold text-brand-darker transition-all hover:brightness-110 active:scale-95"
        >
          <Plus className="size-4" aria-hidden />
          Nueva
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-xl bg-brand-dark p-3 ring-1 ring-brand-primary/15 transition-colors hover:ring-brand-primary/30"
            >
              <FolderTree className="size-4 shrink-0 text-brand-primary/50" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-light">{cat.name}</p>
                <p className="text-[11px] text-brand-light/35">{cat.slug}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-brand-light/40">
                #{cat.display_order}
              </span>
              <button
                type="button"
                onClick={() => { setEditing(cat); setIsFormOpen(true); }}
                aria-label={`Editar ${cat.name}`}
                className="shrink-0 rounded-full p-1.5 text-brand-light/35 transition-colors hover:bg-white/[0.07] hover:text-brand-primary"
              >
                <Pencil className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat)}
                aria-label={`Eliminar ${cat.name}`}
                className="shrink-0 rounded-full p-1.5 text-brand-light/35 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-14 text-center">
          <FolderTree className="size-8 text-brand-light/15" aria-hidden />
          <p className="text-sm font-medium text-brand-light/40">No hay categorías creadas.</p>
        </div>
      )}

      {isFormOpen && (
        <CategoryFormModal
          category={editing}
          onClose={() => { setIsFormOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [order, setOrder] = useState(String(category?.display_order ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (!slug.trim()) return setError('El slug es obligatorio.');

    setIsSubmitting(true);
    const result = await saveCategory({
      id: category?.id,
      name: name.trim(),
      slug: slug.trim(),
      display_order: Math.max(0, Number(order) || 0),
      parent_id: category?.parent_id ?? null,
    });
    setIsSubmitting(false);
    if (!result.success) { setError(result.error ?? 'Error al guardar.'); return; }
    onClose();
  }

  return (
    <ModalShell onClose={onClose} label={category ? `Editar ${category.name}` : 'Nueva categoría'}>
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-primary uppercase">
            {category ? 'Editando' : 'Nueva categoría'}
          </p>
          <h2 className="mt-0.5 font-heading text-lg font-bold text-brand-light">
            {category ? category.name : 'Crear Categoría'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-full p-2 text-brand-light/40 transition-colors hover:bg-white/[0.07] hover:text-brand-light"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
        <Field label="Nombre">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!category) setSlug(autoSlug(e.target.value));
            }}
            placeholder="Ej: Bebidas"
            required
            className={inputClasses}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Slug">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="bebidas"
              required
              className={inputClasses}
            />
          </Field>
          <Field label="Orden">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className={inputClasses}
            />
          </Field>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300 ring-1 ring-red-500/30">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-xl bg-brand-accent px-6 font-heading text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}
        </button>
      </form>
    </ModalShell>
  );
}

import type { ReactNode } from 'react';

export const inputClasses =
  'h-11 w-full rounded-xl border border-white/20 bg-white/[0.09] px-3.5 text-sm text-brand-light placeholder:text-brand-light/50 transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/40';

/* Selects: fondo tinto explícito (#400101) y opciones oscuras para que el texto
   seleccionado sea legible incluso donde el fondo nativo del SO es claro. */
export const selectClasses =
  '[color-scheme:dark] h-11 w-full rounded-xl border border-brand-primary/30 bg-brand-dark px-3.5 text-sm text-brand-light transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/40 [&>option]:bg-brand-dark [&>option]:text-brand-light';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-heading text-xs font-semibold tracking-[0.14em] text-brand-light/60 uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs leading-relaxed text-brand-light/45">{hint}</span>}
    </label>
  );
}

export const checkboxRowClasses =
  'mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary';

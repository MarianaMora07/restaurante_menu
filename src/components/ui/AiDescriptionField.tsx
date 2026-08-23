import { Loader2, Sparkles } from 'lucide-react';
import { inputClasses } from './formStyles';

interface AiDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
}

export function AiDescriptionField({
  value,
  onChange,
  onGenerate,
  isGenerating,
  canGenerate,
  disabled = false,
  rows = 3,
  placeholder = 'Descripción breve…',
}: AiDescriptionFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading text-xs font-semibold tracking-[0.14em] text-brand-light/60 uppercase">
          Descripción
        </span>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating || disabled}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-brand-primary ring-1 ring-brand-primary/30 transition-colors hover:bg-brand-primary/10 hover:text-brand-accent hover:ring-brand-accent/40 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          {isGenerating ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-3.5" aria-hidden />
          )}
          {isGenerating ? 'Generando…' : 'Generar con IA'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${inputClasses} h-auto py-2.5`}
      />
    </div>
  );
}

'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar...', className }: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-light/30" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] pl-10 pr-9 text-sm text-brand-light placeholder:text-brand-light/40 transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-brand-light/40 transition-colors hover:bg-white/[0.1] hover:text-brand-light"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

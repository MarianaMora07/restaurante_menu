'use client';

import type { Category } from '@/types/database';
import { selectClasses } from '@/components/ui/formStyles';

interface CategoryFilterProps {
  categories: Category[];
  selectedId: string | null;
  onChange: (categoryId: string | null) => void;
  className?: string;
}

export function CategoryFilter({ categories, selectedId, onChange, className }: CategoryFilterProps) {
  return (
    <select
      value={selectedId ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={selectClasses + ' h-10 text-xs ' + (className ?? '')}
    >
      <option value="">Todas</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}

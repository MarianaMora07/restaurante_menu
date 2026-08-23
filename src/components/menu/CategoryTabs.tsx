'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Flame, UtensilsCrossed } from 'lucide-react';
import type { Category } from '@/types/database';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  return (
    <nav
      aria-label="Categorías del menú"
      className="sticky top-16 z-40 border-b border-brand-primary/10 bg-brand-darker/85 shadow-elevated backdrop-blur-md transition-all duration-300"
    >
      <div
        ref={trackRef}
        role="tablist"
        className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <TabButton
          active={activeCategory === 'daily'}
          featured
          onClick={() => onSelect('daily')}
        >
          <Flame className="size-4 shrink-0" aria-hidden />
          Menú del Día
        </TabButton>
        <TabButton active={activeCategory === 'all'} onClick={() => onSelect('all')}>
          <UtensilsCrossed className="size-4 shrink-0" aria-hidden />
          Todo
        </TabButton>
        {categories.map((category) => (
          <TabButton
            key={category.id}
            active={activeCategory === category.slug}
            onClick={() => onSelect(category.slug)}
          >
            {category.name}
          </TabButton>
        ))}
      </div>
    </nav>
  );
}

interface TabButtonProps {
  active: boolean;
  featured?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, featured = false, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative flex shrink-0 items-center rounded-full px-4 py-2 font-heading text-sm whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        active ? 'font-bold text-brand-darker' : 'font-medium text-brand-light/60 hover:bg-white/[0.06] hover:text-brand-light'
      )}
    >
      {active && (
        <motion.span
          layoutId={featured ? 'category-pill-featured' : 'category-pill'}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className={cn(
            'absolute inset-0 rounded-full',
            featured
              ? 'bg-gradient-to-r from-brand-accent to-brand-primary shadow-glow-accent'
              : 'bg-brand-primary'
          )}
        />
      )}
      <span className="relative z-[1] flex items-center gap-1.5">{children}</span>
    </button>
  );
}

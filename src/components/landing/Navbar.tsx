'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, UtensilsCrossed } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onOpenMenu: () => void;
}

export function Navbar({ onOpenMenu }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        isScrolled
          ? 'border-b border-white/8 bg-brand-darker/85 shadow-elevated backdrop-blur-md'
          : 'bg-gradient-to-b from-black/55 via-black/25 to-transparent backdrop-blur-[2px]'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver al inicio"
          className="flex items-center gap-2.5 rounded-xl px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent text-brand-darker shadow-glow-accent/40">
            <UtensilsCrossed className="size-4.5" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-brand-light drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
            {siteConfig.name}
          </span>
        </button>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-full bg-white/[0.08] px-4 py-2 font-heading text-sm font-semibold text-brand-light ring-1 ring-white/[0.12] backdrop-blur-sm transition-all hover:bg-brand-primary/15 hover:text-brand-primary hover:ring-brand-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            Menú
          </button>
          <Link
            href="/login"
            aria-label="Acceso al panel de administración"
            className="flex size-10 items-center justify-center rounded-full bg-white/[0.06] text-brand-light/60 ring-1 ring-white/[0.12] backdrop-blur-sm transition-all hover:scale-105 hover:text-brand-primary hover:ring-brand-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <Lock className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

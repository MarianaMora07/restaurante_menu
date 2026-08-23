'use client';

import { Home, Megaphone, MessageCircle, UtensilsCrossed } from 'lucide-react';
import { buildWhatsAppUrl, cn, scrollToSection } from '@/lib/utils';

interface BottomDockProps {
  hasPromos: boolean;
}

export function BottomDock({ hasPromos }: BottomDockProps) {
  return (
    <nav
      aria-label="Navegación rápida"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-brand-dark/85 p-1.5 shadow-elevated ring-1 ring-brand-primary/25 backdrop-blur-md">
        <DockButton
          label="Inicio"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          icon={<Home className="size-5" aria-hidden />}
        />
        <DockButton
          label="Menú"
          onClick={() => scrollToSection('menu')}
          icon={<UtensilsCrossed className="size-5" aria-hidden />}
        />
        {hasPromos && (
          <DockButton
            label="Promociones"
            onClick={() => scrollToSection('promos')}
            icon={<Megaphone className="size-5" aria-hidden />}
          />
        )}
        <a
          href={buildWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className={cn(
            'flex size-11 items-center justify-center rounded-xl text-[#25D366] transition-all',
            'hover:bg-white/[0.08] active:scale-90',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary'
          )}
        >
          <MessageCircle className="size-5" aria-hidden />
        </a>
      </div>
    </nav>
  );
}

interface DockButtonProps {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function DockButton({ label, onClick, icon }: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-11 items-center justify-center rounded-xl text-brand-light/75 transition-all hover:bg-white/[0.08] hover:text-brand-primary active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
    >
      {icon}
    </button>
  );
}

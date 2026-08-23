'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalShellProps {
  onClose: () => void;
  label?: string;
  panelClassName?: string;
  children: ReactNode;
}

export function ModalShell({ onClose, label, panelClassName, children }: ModalShellProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-brand-dark shadow-2xl ring-1 ring-white/10 sm:max-w-lg sm:rounded-3xl',
          panelClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

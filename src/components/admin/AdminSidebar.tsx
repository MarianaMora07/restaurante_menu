'use client';

import { LogOut, UtensilsCrossed, Banknote, Megaphone, FolderTree, Salad, CalendarDays, ClipboardList, MapPin, Bell, X } from 'lucide-react';
import type { AdminSection } from '@/types/database';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { section: AdminSection; label: string; icon: typeof UtensilsCrossed }[] = [
  { section: 'menu', label: 'Menú', icon: UtensilsCrossed },
  { section: 'contornos', label: 'Contornos', icon: Salad },
  { section: 'rate', label: 'Tasa del Día', icon: Banknote },
  { section: 'promos', label: 'Promociones', icon: Megaphone },
  { section: 'categories', label: 'Categorías', icon: FolderTree },
  { section: 'daily-menu', label: 'Menú del Día', icon: CalendarDays },
  { section: 'history', label: 'Historial', icon: ClipboardList },
  { section: 'orders', label: 'Órdenes', icon: Bell },
  { section: 'delivery-zones', label: 'Zonas Delivery', icon: MapPin },
];

const sectionTitles: Record<AdminSection, string> = {
  menu: 'Gestión del Menú',
  contornos: 'Gestión de Contornos',
  rate: 'Tasa del Día',
  promos: 'Promociones',
  categories: 'Categorías',
  'daily-menu': 'Generar Menú del Día',
  history: 'Historial de Órdenes',
  orders: 'Órdenes en Vivo',
  'delivery-zones': 'Zonas de Delivery',
};

export function AdminSidebar({ activeSection, onNavigate, onLogout, isOpen, onClose }: AdminSidebarProps) {
  function handleNav(section: AdminSection) {
    onNavigate(section);
    onClose();
  }

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-dark ring-1 ring-brand-primary/15 transition-transform duration-300 ease-out',
          'lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:rounded-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-tight text-brand-light">
              {siteConfig.name}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-brand-primary/60 uppercase">
              Panel Admin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-full p-1.5 text-brand-light/40 transition-colors hover:bg-white/[0.07] hover:text-brand-light lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Secciones del administrador">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ section, label, icon: Icon }) => {
              const active = activeSection === section;
              return (
                <li key={section}>
                  <button
                    type="button"
                    onClick={() => handleNav(section)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-brand-accent/15 text-brand-primary ring-1 ring-brand-accent/30'
                        : 'text-brand-light/55 hover:bg-white/[0.05] hover:text-brand-light'
                    )}
                  >
                    <Icon className={cn('size-[18px] shrink-0', active ? 'text-brand-primary' : 'text-brand-light/35')} aria-hidden />
                    <span className="truncate">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/5 px-3 py-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-brand-light/45 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export { sectionTitles };

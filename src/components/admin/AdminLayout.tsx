'use client';

import { useState, useCallback, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import type { Category, DeliveryZone, Dish, Order, Promo, RateConfig, AdminSection } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { toggleDailyMenu, toggleDishAvailability } from '@/app/actions/dishes';
import { togglePromoActive } from '@/app/actions/promos';
import { AdminSidebar, sectionTitles } from './AdminSidebar';
import { MenuSection } from './MenuSection';
import { ContornosSection } from './ContornosSection';
import { PromosSection } from './PromosSection';
import { CategoriesSection } from './CategoriesSection';
import { DailyMenuSection } from './DailyMenuSection';
import { DeliveryZonesCard } from './DeliveryZonesCard';
import { HistorySection } from './HistorySection';
import { RateSettingsCard } from './RateSettingsCard';

interface AdminLayoutProps {
  categories: Category[];
  dishes: Dish[];
  promos: Promo[];
  orders: Order[];
  deliveryZones: DeliveryZone[];
  rateConfig: RateConfig;
}

type DishFlag = { type: 'dish'; id: string; field: 'is_available' | 'is_daily_menu'; value: boolean };
type PromoFlag = { type: 'promo'; id: string; value: boolean };
type FlagUpdate = DishFlag | PromoFlag;

export function AdminLayout({ categories, dishes, promos, orders, deliveryZones, rateConfig }: AdminLayoutProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>('menu');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticDishes, applyDishOptimistic] = useOptimistic(
    dishes,
    (state, update: DishFlag) =>
      state.map((d) => (d.id === update.id ? { ...d, [update.field]: update.value } : d))
  );

  const [optimisticPromos, applyPromoOptimistic] = useOptimistic(
    promos,
    (state, update: PromoFlag) =>
      state.map((p) => (p.id === update.id ? { ...p, is_active: update.value } : p))
  );

  const handleDishToggle = useCallback(
    (dishId: string, field: 'is_available' | 'is_daily_menu', value: boolean, action: typeof toggleDishAvailability) => {
      setError(null);
      startTransition(async () => {
        applyDishOptimistic({ type: 'dish', id: dishId, field, value });
        const result = await action(dishId, value);
        if (!result.success) setError(result.error ?? 'Error al actualizar plato.');
      });
    },
    [applyDishOptimistic]
  );

  const handlePromoToggle = useCallback(
    (promoId: string, value: boolean) => {
      setError(null);
      startTransition(async () => {
        applyPromoOptimistic({ type: 'promo', id: promoId, value });
        const result = await togglePromoActive(promoId, value);
        if (!result.success) setError(result.error ?? 'Error al actualizar promoción.');
      });
    },
    [applyPromoOptimistic]
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh bg-brand-darker">
      <AdminSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-brand-darker/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="rounded-xl p-2 text-brand-light/60 transition-colors hover:bg-white/[0.07] hover:text-brand-light"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <h1 className="truncate font-heading text-sm font-bold text-brand-light">
            {sectionTitles[activeSection]}
          </h1>
        </header>

        {/* Content */}
        <main className="w-full max-w-3xl flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
          <div className="hidden lg:block mb-6">
            <h1 className="font-heading text-xl font-bold tracking-tight text-brand-light">
              {sectionTitles[activeSection]}
            </h1>
          </div>

          <ContentRouter
            activeSection={activeSection}
            categories={categories}
            dishes={optimisticDishes}
            promos={optimisticPromos}
            orders={orders}
            deliveryZones={deliveryZones}
            rateConfig={rateConfig}
            isPending={isPending}
            onDishToggle={handleDishToggle}
            onPromoToggle={handlePromoToggle}
          />
        </main>
      </div>

      {/* Error toast */}
      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-slide-up"
        >
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Descartar"
            className="shrink-0 rounded-full p-1 transition-colors hover:bg-red-500"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

interface ContentRouterProps {
  activeSection: AdminSection;
  categories: Category[];
  dishes: Dish[];
  promos: Promo[];
  orders: Order[];
  deliveryZones: DeliveryZone[];
  rateConfig: RateConfig;
  isPending: boolean;
  onDishToggle: (dishId: string, field: 'is_available' | 'is_daily_menu', value: boolean, action: typeof toggleDishAvailability) => void;
  onPromoToggle: (promoId: string, value: boolean) => void;
}

function ContentRouter({
  activeSection,
  categories,
  dishes,
  promos,
  orders,
  deliveryZones,
  rateConfig,
  isPending,
  onDishToggle,
  onPromoToggle,
}: ContentRouterProps) {
  switch (activeSection) {
    case 'menu':
      return (
        <MenuSection
          categories={categories}
          dishes={dishes}
          rate={rateConfig.effective}
          isPending={isPending}
          onToggleAvailability={(id, v) => onDishToggle(id, 'is_available', v, toggleDishAvailability)}
          onToggleDailyMenu={(id, v) => onDishToggle(id, 'is_daily_menu', v, toggleDailyMenu)}
        />
      );
    case 'contornos':
      return (
        <ContornosSection
          categories={categories}
          dishes={dishes}
          rate={rateConfig.effective}
          isPending={isPending}
          onToggleAvailability={(id, v) => onDishToggle(id, 'is_available', v, toggleDishAvailability)}
          onToggleDailyMenu={(id, v) => onDishToggle(id, 'is_daily_menu', v, toggleDailyMenu)}
        />
      );
    case 'rate':
      return (
        <RateSettingsCard
          key={`${rateConfig.settings.mode}-${rateConfig.settings.adjustPercent}`}
          settings={rateConfig.settings}
          bcv={rateConfig.bcv}
        />
      );
    case 'promos':
      return (
        <PromosSection
          promos={promos}
          isPending={isPending}
          onToggleActive={onPromoToggle}
        />
      );
    case 'categories':
      return <CategoriesSection categories={categories} />;
    case 'daily-menu':
      return <DailyMenuSection categories={categories} dishes={dishes} rate={rateConfig.effective} />;
    case 'history':
      return <HistorySection orders={orders} />;
    case 'delivery-zones':
      return <DeliveryZonesCard zones={deliveryZones} />;
  }
}

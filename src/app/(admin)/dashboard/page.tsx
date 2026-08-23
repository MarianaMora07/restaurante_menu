import type { Metadata } from 'next';
import { getAllPromos, getCategories, getDishes } from '@/lib/supabase/queries';
import { getRateConfig } from '@/lib/bcv';
import { DashboardView } from '@/components/admin/DashboardView';

export const metadata: Metadata = {
  title: 'Panel | JOSWIL RESTAURANTE',
};

export default async function DashboardPage() {
  const [{ data: categories }, { data: dishes }, { data: promos }, rateConfig] =
    await Promise.all([getCategories(), getDishes(), getAllPromos(), getRateConfig()]);

  return (
    <DashboardView
      categories={categories}
      dishes={dishes}
      promos={promos}
      rateConfig={rateConfig}
    />
  );
}

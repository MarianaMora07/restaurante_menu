import type { Metadata } from 'next';
import { getAllPromos, getCategories, getDishes, getOrders } from '@/lib/supabase/queries';
import { getRateConfig } from '@/lib/bcv';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Panel | JOSWIL RESTAURANTE',
};

export default async function DashboardPage() {
  const [{ data: categories }, { data: dishes }, { data: promos }, { data: orders }, rateConfig] =
    await Promise.all([getCategories(), getDishes(), getAllPromos(), getOrders(), getRateConfig()]);

  return (
    <AdminLayout
      categories={categories}
      dishes={dishes}
      promos={promos}
      orders={orders}
      rateConfig={rateConfig}
    />
  );
}

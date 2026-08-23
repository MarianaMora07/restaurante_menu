import type { Metadata } from 'next';
import { getAllPromos, getCategories, getDishes } from '@/lib/supabase/queries';
import { DashboardView } from '@/components/admin/DashboardView';

export const metadata: Metadata = {
  title: 'Panel | JOSWIL RESTAURANTE',
};

export default async function DashboardPage() {
  const [{ data: categories }, { data: dishes }, { data: promos }] = await Promise.all([
    getCategories(),
    getDishes(),
    getAllPromos(),
  ]);

  return <DashboardView categories={categories} dishes={dishes} promos={promos} />;
}

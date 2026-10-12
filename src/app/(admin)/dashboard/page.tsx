import type { Metadata } from 'next';
import { getAllPromos, getCategories, getDeliveryZones, getDishes, getOrders, getRestaurantSchedule, getMenuTemplate } from '@/lib/supabase/queries';
import { getRateConfig } from '@/lib/bcv';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Panel | JOSWIL RESTAURANTE',
};

export default async function DashboardPage() {
  const [{ data: categories }, { data: dishes }, { data: promos }, { data: orders }, { data: deliveryZones }, { data: schedule }, { data: menuTemplate }, rateConfig] =
    await Promise.all([getCategories(), getDishes(), getAllPromos(), getOrders(), getDeliveryZones(), getRestaurantSchedule(), getMenuTemplate(), getRateConfig()]);

  return (
    <AdminLayout
      categories={categories}
      dishes={dishes}
      promos={promos}
      orders={orders}
      deliveryZones={deliveryZones}
      rateConfig={rateConfig}
      schedule={schedule}
      menuTemplate={menuTemplate}
    />
  );
}

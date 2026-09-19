import { getActivePromos, getCategories, getDeliveryZones, getDishes } from '@/lib/supabase/queries';
import { getRateConfig } from '@/lib/bcv';
import { MenuBookShell } from '@/components/book/MenuBookShell';

export default async function Home() {
  const [{ data: categories }, { data: dishes }, { data: promos }, { data: deliveryZones }, rateConfig] =
    await Promise.all([getCategories(), getDishes(), getActivePromos(), getDeliveryZones(), getRateConfig()]);

  const slides = promos;

  return (
    <MenuBookShell
      promos={slides}
      categories={categories}
      dishes={dishes}
      deliveryZones={deliveryZones}
      rate={rateConfig.effective}
    />
  );
}

import { getActivePromos, getCategories, getDeliveryZones, getDishes, getRestaurantSchedule } from '@/lib/supabase/queries';
import { getRateConfig } from '@/lib/bcv';
import { createClient } from '@/lib/supabase/server';
import { MenuBookShell } from '@/components/book/MenuBookShell';

export default async function Home() {
  const [{ data: categories }, { data: dishes }, { data: promos }, { data: deliveryZones }, { data: schedule }, rateConfig] =
    await Promise.all([getCategories(), getDishes(), getActivePromos(), getDeliveryZones(), getRestaurantSchedule(), getRateConfig()]);

  // Bypass del horario cerrado para el admin logueado (preview del menú público).
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAdmin = Boolean(user);
  } catch {
    isAdmin = false;
  }

  const slides = promos;

  return (
    <MenuBookShell
      promos={slides}
      categories={categories}
      dishes={dishes}
      deliveryZones={deliveryZones}
      rate={rateConfig.effective}
      schedule={schedule}
      isAdmin={isAdmin}
    />
  );
}

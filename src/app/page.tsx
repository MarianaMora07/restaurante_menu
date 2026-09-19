import { getActivePromos, getCategories, getDishes } from '@/lib/supabase/queries';
import { getRateConfig } from '@/lib/bcv';
import { MenuBookShell } from '@/components/book/MenuBookShell';

export default async function Home() {
  const [{ data: categories }, { data: dishes }, { data: promos }, rateConfig] =
    await Promise.all([getCategories(), getDishes(), getActivePromos(), getRateConfig()]);

  const slides = promos;

  return (
    <MenuBookShell
      promos={slides}
      categories={categories}
      dishes={dishes}
      rate={rateConfig.effective}
    />
  );
}

import { getActivePromos, getCategories, getDishes } from '@/lib/supabase/queries';
import { MenuBookShell } from '@/components/book/MenuBookShell';
import type { Promo } from '@/types/database';

export default async function Home() {
  const [{ data: categories }, { data: dishes }, { data: promos }] = await Promise.all([
    getCategories(),
    getDishes(),
    getActivePromos(),
  ]);

  const slides =
    promos.length > 0
      ? promos
      : dishes
          .filter((dish) => dish.is_daily_menu && dish.is_available && dish.image_url)
          .slice(0, 6)
          .map(
            (dish): Promo => ({
              id: `daily-${dish.id}`,
              title: dish.name,
              description: dish.description,
              image_url: dish.image_url as string,
              duration_seconds: 6,
              display_order: 0,
              is_active: true,
            })
          );

  return <MenuBookShell promos={slides} categories={categories} dishes={dishes} />;
}

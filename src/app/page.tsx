import { getActivePromos, getCategories, getDishes } from '@/lib/supabase/queries';
import { MenuView } from '@/components/menu/MenuView';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { PromoBanner } from '@/components/landing/PromoBanner';
import { BottomDock } from '@/components/landing/BottomDock';
import { Footer } from '@/components/landing/Footer';
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

  return (
    <div className="flex min-h-dvh flex-col bg-brand-darker">
      <Navbar hasPromos={slides.length > 0} />
      <HeroSection hasPromos={slides.length > 0} />
      <PromoBanner promos={slides} />
      <MenuView categories={categories} dishes={dishes} />
      <BottomDock hasPromos={slides.length > 0} />
      <Footer />
    </div>
  );
}

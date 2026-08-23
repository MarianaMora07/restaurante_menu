'use client';

import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { Navbar } from './Navbar';

interface LandingViewProps {
  onOpenMenu: () => void;
}

/* Portada de una sola pantalla: hero a viewport completo con la información
   del pie superpuesta en la parte inferior (sin scroll). */
export function LandingView({ onOpenMenu }: LandingViewProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-brand-darker">
      <HeroSection onOpenMenu={onOpenMenu} />
      <div className="absolute inset-x-0 bottom-0 z-30">
        <Footer />
      </div>
      <Navbar onOpenMenu={onOpenMenu} />
    </div>
  );
}

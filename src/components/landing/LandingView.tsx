'use client';

import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { Navbar } from './Navbar';

interface LandingViewProps {
  onOpenMenu: () => void;
}

/* Portada de una sola pantalla: el video cubre todo el viewport (incluido el fondo
   del footer) y el contenido se distribuye con flex, sin scroll ni recortes. */
export function LandingView({ onOpenMenu }: LandingViewProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-darker">
      {/* Fondo de video compartido por hero y footer */}
      <div aria-hidden className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="/videos/video_login.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-linear-to-t from-[#260101] via-[#260101]/70 to-[#260101]/40" />
      </div>

      <Navbar onOpenMenu={onOpenMenu} />
      <HeroSection onOpenMenu={onOpenMenu} />
      <Footer />
    </div>
  );
}

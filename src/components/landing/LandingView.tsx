'use client';

import type { RestaurantSchedule } from '@/types/database';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { Navbar } from './Navbar';

interface LandingViewProps {
  onOpenMenu: () => void;
  schedule: RestaurantSchedule | null;
}

/* PRNG determinista (mulberry32) para partículas idénticas en SSR y
   cliente, evitando mismatch de hidratación. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Partículas de brasa cálida flotando sobre el video. */
const EMBER_PARTICLES = (() => {
  const rand = mulberry32(42);
  return Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: rand() * 100,
    size: 1.5 + rand() * 2.5,
    duration: 9 + rand() * 10,
    delay: rand() * 12,
    drift: (rand() - 0.5) * 60,
  }));
})();

function EmberParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {EMBER_PARTICLES.map((p) => (
        <span
          key={p.id}
          className="ember-particle absolute bottom-0 rounded-full bg-brand-primary/70"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* Portada de una sola pantalla, estilo cinematográfico: el video cubre
   todo el viewport con vignette, partículas de brasa y el contenido
   del hero con marco dorado tipo escena de película. */
export function LandingView({ onOpenMenu, schedule }: LandingViewProps) {
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
        {/* Vignette cinematográfico: oscurece bordes para que el centro resalte */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(38,1,1,0.65)_72%,rgba(38,1,1,0.95)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#260101] via-[#260101]/60 to-[#260101]/65" />
      </div>

      <EmberParticles />

      <Navbar onOpenMenu={onOpenMenu} />
      <HeroSection onOpenMenu={onOpenMenu} />
      <Footer schedule={schedule} />
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Lock, Mail, UtensilsCrossed } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const inputClasses =
  'h-12 w-full rounded-xl border border-white/20 bg-white/[0.09] pl-11 pr-4 text-sm text-brand-light placeholder:text-brand-light/50 transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/40';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Correo o contraseña incorrectos.'
            : authError.message
        );
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-darker px-4">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src="/videos/video_hero.mp4" type="video/mp4" />
      </video>
      <div aria-hidden className="absolute inset-0 z-10 bg-[#260101]/80" />

      <Link
        href="/"
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-30 flex items-center gap-2 rounded-full bg-white/[0.08] py-2.5 pr-5 pl-4 font-heading text-sm font-semibold text-brand-light ring-1 ring-white/15 backdrop-blur-md transition-all hover:bg-white/[0.14] hover:text-brand-primary hover:ring-brand-primary/40 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver al Restaurante
      </Link>

      <main className="relative z-20 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 pb-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-primary to-brand-accent text-brand-darker shadow-glow-accent">
            <UtensilsCrossed className="size-7" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand-light">
            Panel de Administración
          </h1>
          <p className="text-sm text-brand-light/60">
            Inicia sesión para gestionar el menú y las promociones.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-brand-primary/20 bg-brand-dark/80 p-8 shadow-2xl backdrop-blur-md"
        >
          <label className="relative block">
            <span className="sr-only">Correo electrónico</span>
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-brand-light/70"
              aria-hidden
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@restaurante.com"
              autoComplete="email"
              required
              className={inputClasses}
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Contraseña</span>
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-brand-light/70"
              aria-hidden
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
              className={inputClasses}
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300 ring-1 ring-red-500/30"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex h-12 items-center justify-center rounded-xl bg-linear-to-r from-brand-accent to-brand-primary font-heading text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

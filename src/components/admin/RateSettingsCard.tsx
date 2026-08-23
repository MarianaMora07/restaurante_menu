'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Loader2 } from 'lucide-react';
import type { BcvRate, RateMode, RateSettings } from '@/types/database';
import { cn, formatBolivares } from '@/lib/utils';
import { saveRateSettings } from '@/app/actions/settings';

interface RateSettingsCardProps {
  settings: RateSettings;
  bcv: BcvRate | null;
}

const MIN_ADJUST_PERCENT = -90;
const MAX_ADJUST_PERCENT = 500;

function formatBcvDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

interface ModeOption {
  value: RateMode;
  title: string;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'bcv',
    title: 'Tasa BCV oficial',
    description: 'Se toma directo del Banco Central y se actualiza automáticamente.',
  },
  {
    value: 'custom',
    title: 'Personalizada (BCV + ajuste)',
    description:
      'Aplica un porcentaje fijo sobre la BCV. Se recalcula sola cuando la tasa cambia.',
  },
];

export function RateSettingsCard({ settings, bcv }: RateSettingsCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<RateMode>(settings.mode);
  const [percentInput, setPercentInput] = useState(String(settings.adjustPercent));
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const percentValue = Number(percentInput);
  const percentValid =
    Number.isFinite(percentValue) &&
    percentValue >= MIN_ADJUST_PERCENT &&
    percentValue <= MAX_ADJUST_PERCENT;
  const previewRate =
    bcv == null
      ? null
      : mode === 'custom' && percentValid
        ? Math.round(bcv.rate * (1 + percentValue / 100) * 100) / 100
        : bcv.rate;

  async function handleSave() {
    if (!percentValid) {
      setFeedback(`El ajuste debe estar entre ${MIN_ADJUST_PERCENT}% y ${MAX_ADJUST_PERCENT}%.`);
      return;
    }
    setIsSaving(true);
    setFeedback(null);

    const result = await saveRateSettings({ mode, adjustPercent: percentValue });
    setIsSaving(false);

    if (!result.success) {
      setFeedback(result.error ?? 'No se pudo guardar la configuración.');
      return;
    }
    router.refresh();
  }

  return (
    <section
      aria-label="Configuración de precios en bolívares"
      className="flex flex-col gap-5 rounded-2xl bg-brand-dark p-5 ring-1 ring-brand-primary/20"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-bold tracking-[0.16em] text-brand-light/70 uppercase">
            Precios en Bolívares
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-brand-light/45">
            Define cómo se calcula la conversión USD → Bs mostrada al público.
          </p>
        </div>
        <Banknote className="size-5 shrink-0 text-brand-primary" aria-hidden />
      </header>

      {bcv ? (
        <p className="text-xs text-brand-light/55">
          Tasa BCV actual:{' '}
          <strong className="font-semibold text-brand-light">{formatBolivares(bcv.rate)}</strong>
          {bcv.updatedAt && ` · actualizada ${formatBcvDate(bcv.updatedAt)}`}
        </p>
      ) : (
        <p
          role="alert"
          className="rounded-xl bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-300 ring-1 ring-amber-500/25"
        >
          No se pudo obtener la tasa BCV en este momento. Los precios se mostrarán solo en USD
          hasta que el servicio esté disponible.
        </p>
      )}

      <fieldset className="flex flex-col gap-2.5 sm:flex-row">
        <legend className="sr-only">Modo de cálculo de la tasa</legend>
        {MODE_OPTIONS.map((option) => {
          const selected = mode === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex flex-1 cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1 transition-colors select-none',
                selected
                  ? 'bg-brand-accent/10 ring-brand-accent/50'
                  : 'ring-white/[0.08] hover:bg-white/[0.04]'
              )}
            >
              <input
                type="radio"
                name="usd-rate-mode"
                checked={selected}
                onChange={() => setMode(option.value)}
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-brand-light">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-brand-light/50">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {mode === 'custom' && (
        <label className="flex max-w-xs flex-col gap-1.5">
          <span className="font-heading text-xs font-semibold tracking-[0.14em] text-brand-light/60 uppercase">
            Ajuste sobre la BCV (%)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={MIN_ADJUST_PERCENT}
            max={MAX_ADJUST_PERCENT}
            step="0.01"
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/20 bg-white/[0.09] px-3.5 text-sm text-brand-light placeholder:text-brand-light/50 transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
          />
          <span className="text-xs leading-relaxed text-brand-light/45">
            Ej: 5 aplica una tasa efectiva de BCV × 1.05.
          </span>
        </label>
      )}

      {previewRate !== null && (
        <p className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-brand-light/70 ring-1 ring-white/[0.06]">
          Tasa efectiva para el público:{' '}
          <strong className="font-bold text-brand-primary">{formatBolivares(previewRate)}</strong>{' '}
          / USD
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {feedback && (
          <p
            role={feedback.startsWith('El ajuste') || feedback.includes('No se pudo') ? 'alert' : undefined}
            className="flex-1 text-right text-xs font-medium text-red-300"
          >
            {feedback}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-brand-accent px-5 font-heading text-sm font-bold text-brand-darker transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isSaving ? 'Guardando…' : 'Guardar tasa'}
        </button>
      </div>
    </section>
  );
}

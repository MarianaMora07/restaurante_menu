'use client';

import { useCallback, useState } from 'react';
import { CalendarClock, Save } from 'lucide-react';
import type { RestaurantSchedule, ScheduleDay } from '@/types/database';
import { saveSchedule } from '@/app/actions/settings';
import { DAY_LABELS, formatTime12 } from '@/lib/schedule';
import { cn } from '@/lib/utils';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface ScheduleSectionProps {
  schedule: RestaurantSchedule;
}

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function ScheduleSection({ schedule }: ScheduleSectionProps) {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const [days, setDays] = useState<ScheduleDay[]>(() =>
    [...schedule.days].sort((a, b) => a.day - b.day)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDay = useCallback((dayNum: number, patch: Partial<ScheduleDay>) => {
    setDays((prev) => prev.map((d) => (d.day === dayNum ? { ...d, ...patch } : d)));
    setSaved(false);
    setError(null);
  }, []);

  const validateDays = useCallback((): string | null => {
    for (const d of days) {
      if (!d.isOpen) continue;
      if (!HHMM_RE.test(d.open) || !HHMM_RE.test(d.close)) {
        return `${DAY_LABELS[d.day]}: formato de hora inválido (usa el selector con AM/PM).`;
      }
      if (d.open === d.close) {
        return `${DAY_LABELS[d.day]}: la hora de apertura y cierre no pueden ser iguales (${formatTime12(d.open)}).`;
      }
      if (d.open > d.close) {
        return `${DAY_LABELS[d.day]}: el cierre (${formatTime12(d.close)}) debe ser posterior a la apertura (${formatTime12(d.open)}).`;
      }
    }
    return null;
  }, [days]);

  const handleSave = useCallback(async () => {
    const validationError = validateDays();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await saveSchedule({ enabled, days });
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? 'Error desconocido');
      return;
    }
    setSaved(true);
  }, [enabled, days, validateDays]);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-brand-dark/80 p-5 ring-1 ring-brand-primary/20">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-brand-primary" aria-hidden />
            <h3 className="font-heading text-sm font-bold text-brand-light">
              Horario del Restaurante
            </h3>
          </div>
          <ToggleSwitch
            label={enabled ? 'Activo' : 'Inactivo'}
            title={
              enabled
                ? 'Horario activo: el menú público se bloquea fuera de este horario.'
                : 'Horario inactivo: el menú siempre está disponible.'
            }
            checked={enabled}
            checkedClassName="bg-brand-primary"
            onChange={() => {
              setEnabled((v) => !v);
              setSaved(false);
            }}
          />
        </div>

        <p className="mb-4 text-xs leading-relaxed text-brand-light/40">
          {enabled
            ? 'Cuando el horario está activo, el sitio público muestra una pantalla de "cerrado" fuera de las horas configuradas (hora de Venezuela, UTC-4).'
            : 'Activa el horario para bloquear el menú público cuando el restaurante esté cerrado.'}
        </p>

        <div className="flex flex-col gap-2">
          {days.map((d) => (
            <div
              key={d.day}
              className={cn(
                'flex items-center gap-3 rounded-xl bg-white/[0.04] px-3.5 py-2.5 ring-1 ring-white/[0.06]',
                !d.isOpen && 'opacity-55'
              )}
            >
              <span className="w-24 shrink-0 text-sm font-semibold text-brand-light">
                {DAY_LABELS[d.day]}
              </span>

              {d.isOpen ? (
                <>
                  <input
                    type="time"
                    value={d.open}
                    onChange={(e) => updateDay(d.day, { open: e.target.value })}
                    aria-label={`Hora de apertura ${DAY_LABELS[d.day]}`}
                    className="h-9 rounded-lg bg-white/[0.06] px-2.5 text-sm text-brand-light ring-1 ring-white/10 focus:outline-none focus:ring-brand-primary/50 [color-scheme:dark]"
                  />
                  <span className="text-xs text-brand-light/30">–</span>
                  <input
                    type="time"
                    value={d.close}
                    onChange={(e) => updateDay(d.day, { close: e.target.value })}
                    aria-label={`Hora de cierre ${DAY_LABELS[d.day]}`}
                    className="h-9 rounded-lg bg-white/[0.06] px-2.5 text-sm text-brand-light ring-1 ring-white/10 focus:outline-none focus:ring-brand-primary/50 [color-scheme:dark]"
                  />
                  <span className="hidden text-[11px] font-medium whitespace-nowrap text-brand-primary/80 sm:inline">
                    {formatTime12(d.open)} – {formatTime12(d.close)}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-xs font-medium text-brand-light/40">Cerrado</span>
              )}

              <div className="ml-auto">
                <ToggleSwitch
                  label={d.isOpen ? 'Abierto' : 'Cerrado'}
                  checked={d.isOpen}
                  checkedClassName="bg-brand-primary"
                  onChange={() => updateDay(d.day, { isOpen: !d.isOpen })}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all',
              saving
                ? 'cursor-not-allowed bg-brand-primary/20 text-brand-light/30'
                : 'bg-brand-primary text-brand-darker hover:bg-brand-accent'
            )}
          >
            <Save className="size-3.5" aria-hidden />
            {saving ? 'Guardando…' : 'Guardar horario'}
          </button>
          {saved && <span className="text-xs font-medium text-emerald-400">¡Guardado!</span>}
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}

import type { RestaurantSchedule } from '@/types/database';

export const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/** Fecha/hora actual en la zona horaria de Venezuela (America/Caracas, UTC-4). */
export function getCaracasNow(now: Date = new Date()): { day: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Caracas',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[weekday] ?? now.getDay();
  // hour "24" can appear at midnight in some engines
  const h = hour === 24 ? 0 : hour;
  return { day, minutes: h * 60 + minute };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** Formatea "HH:MM" (24h) como "h:MM AM/PM" (ej: "13:05" → "1:05 PM"). */
export function formatTime12(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export interface ScheduleSlot {
  days: string;
  time: string;
}

/** Agrupa días consecutivos con el mismo horario en slots compactos (Lun–Vie, etc.). */
export function getScheduleSlots(schedule: RestaurantSchedule | null | undefined): ScheduleSlot[] {
  if (!schedule || !schedule.enabled) return [];
  // Orden de la semana: lunes(1) … domingo(0)
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const entries = weekOrder
    .map((day) => schedule.days.find((d) => d.day === day))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  const slots: ScheduleSlot[] = [];
  let run: { days: number[]; isOpen: boolean; open: string; close: string } | null = null;

  const flush = () => {
    if (!run) return;
    const labels = run.days.map((d) => DAY_LABELS[d]);
    const daysLabel =
      labels.length === 1
        ? labels[0]
        : labels.length === 2
          ? `${labels[0]} y ${labels[1]}`
          : `${labels[0]} a ${labels[labels.length - 1]}`;
    slots.push({
      days: daysLabel,
      time: run.isOpen ? `${formatTime12(run.open)} – ${formatTime12(run.close)}` : 'Cerrado',
    });
    run = null;
  };

  for (const d of entries) {
    const same =
      run &&
      run.isOpen === d.isOpen &&
      (!d.isOpen || (run.open === d.open && run.close === d.close));
    if (same && run) {
      run.days.push(d.day);
    } else {
      flush();
      run = { days: [d.day], isOpen: d.isOpen, open: d.open, close: d.close };
    }
  }
  flush();
  return slots;
}

export function isScheduleOpen(
  schedule: RestaurantSchedule | null | undefined,
  now: Date = new Date()
): boolean {
  // Sin horaria configurada (enabled=false) el restaurante se considera abierto.
  if (!schedule || !schedule.enabled) return true;

  const { day, minutes } = getCaracasNow(now);
  const today = schedule.days.find((d) => d.day === day);
  if (!today || !today.isOpen) return false;

  const openM = toMinutes(today.open);
  const closeM = toMinutes(today.close);
  // Soporte para horario que cruza la medianoche (ej: 18:00 – 02:00).
  if (openM <= closeM) return minutes >= openM && minutes < closeM;
  return minutes >= openM || minutes < closeM;
}

/** Próxima apertura a partir de la horaria (para el mensaje de "cerrado"). */
export function getNextOpening(
  schedule: RestaurantSchedule,
  now: Date = new Date()
): { day: number; open: string } | null {
  const { day, minutes } = getCaracasNow(now);
  const ordered = [0, 1, 2, 3, 4, 5, 6]
    .map((offset) => {
      const d = (day + offset) % 7;
      return { offset, entry: schedule.days.find((x) => x.day === d) };
    })
    .filter((x): x is { offset: number; entry: (typeof schedule.days)[number] } => Boolean(x.entry));

  for (const { offset, entry } of ordered) {
    if (!entry.isOpen) continue;
    const openM = toMinutes(entry.open);
    if (offset > 0 || minutes < openM) return { day: entry.day, open: entry.open };
  }
  return null;
}

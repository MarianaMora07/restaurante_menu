import { getRateSettings } from '@/lib/supabase/queries';
import type { BcvRate, RateConfig, RateSettings, UsdRateInfo } from '@/types/database';

interface DolarApiResponse {
  promedio?: number;
  fechaActualizacion?: string;
}

const DOLAR_API_ENDPOINT = 'https://ve.dolarapi.com/v1/dolares/oficial';
const FALLBACK_RATE_ENV_KEY = 'USD_BCV_RATE_FALLBACK';
const MIN_ADJUST_PERCENT = -90;
const MAX_ADJUST_PERCENT = 500;

/** Días hábiles (Mon–Fri) entre la fecha de la tasa y hoy, en Caracas. */
function businessDaysBehind(rateDate: Date, now: Date): number {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(rateDate);
  const [ry, rm, rd] = ymd.split('-').map(Number);

  const todayYmd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [ty, tm, td] = todayYmd.split('-').map(Number);

  let business = 0;
  let cursor = Date.UTC(ry, rm - 1, rd);
  const end = Date.UTC(ty, tm - 1, td);
  while (cursor < end) {
    cursor += 86_400_000;
    const dow = new Date(cursor).getUTCDay();
    if (dow >= 1 && dow <= 5) business += 1;
  }
  return business;
}

function isRateStale(updatedAt: string | null, now: Date = new Date()): boolean {
  if (!updatedAt) return false;
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return false;
  // 2+ días hábiles: viernes visto el martes = stale; viernes visto el lunes = ok (BCV aún no publicó)
  return businessDaysBehind(parsed, now) >= 2;
}

function readFallbackRate(): BcvRate | null {
  const manualRate = Number(process.env[FALLBACK_RATE_ENV_KEY]);
  if (!Number.isFinite(manualRate) || manualRate <= 0) return null;
  return { rate: manualRate, updatedAt: null };
}

export async function getOfficialBcvRate(): Promise<BcvRate | null> {
  try {
    const response = await fetch(DOLAR_API_ENDPOINT, { next: { revalidate: 3600 } });
    if (!response.ok) return readFallbackRate();

    const payload = (await response.json()) as DolarApiResponse;
    const rate = Number(payload.promedio);
    if (!Number.isFinite(rate) || rate <= 0) return readFallbackRate();

    const updatedAt = payload.fechaActualizacion ?? null;
    const isStale = isRateStale(updatedAt);

    // Si la tasa del BCV está obsoleta (ej: viernes visto el martes+),
    // preferir el fallback manual si existe; si no, marcar isStale.
    if (isStale) {
      const fallback = readFallbackRate();
      if (fallback) return { ...fallback, isStale: true };
    }
    return { rate, updatedAt, isStale };
  } catch {
    return readFallbackRate();
  }
}

export function normalizeAdjustPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_ADJUST_PERCENT, Math.max(MIN_ADJUST_PERCENT, value));
}

export function resolveEffectiveRate(settings: RateSettings, bcv: BcvRate): UsdRateInfo {
  const isCustom = settings.mode === 'custom';
  const factor = 1 + settings.adjustPercent / 100;
  return {
    rate: isCustom ? Math.round(bcv.rate * factor * 100) / 100 : bcv.rate,
    source: settings.mode,
    bcvRate: bcv.rate,
    adjustPercent: isCustom ? settings.adjustPercent : 0,
    updatedAt: bcv.updatedAt,
    isStale: bcv.isStale ?? false,
  };
}

export async function getRateConfig(): Promise<RateConfig> {
  const [settingsResult, bcv] = await Promise.all([
    getRateSettings(),
    getOfficialBcvRate(),
  ]);
  const settings: RateSettings = {
    ...settingsResult.data,
    adjustPercent: normalizeAdjustPercent(settingsResult.data.adjustPercent),
  };
  return {
    settings,
    bcv,
    effective: bcv ? resolveEffectiveRate(settings, bcv) : null,
  };
}

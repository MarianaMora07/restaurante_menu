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
    return { rate, updatedAt: payload.fechaActualizacion ?? null };
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

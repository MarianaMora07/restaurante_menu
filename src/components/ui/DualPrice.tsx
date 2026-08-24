import type { UsdRateInfo } from '@/types/database';
import { cn, formatBolivares, formatPrice } from '@/lib/utils';

interface DualPriceProps {
  amount: number;
  rate: UsdRateInfo | null;
  align?: 'start' | 'end';
  className?: string;
}

/* Bloque parejo USD + Bs: ambas líneas comparten borde (align), dígitos
   tabulares y altura fija para que todas las tarjetas queden alineadas. */
export function DualPrice({ amount, rate, align = 'end', className }: DualPriceProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 flex-col gap-1 leading-none tabular-nums',
        align === 'end' ? 'items-end text-right' : 'items-start text-left',
        className
      )}
    >
      <span className="whitespace-nowrap">{formatPrice(amount)}</span>
      {rate && (
        <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-brand-light/50">
          {formatBolivares(amount * rate.rate)}
        </span>
      )}
    </span>
  );
}

import type { UsdRateInfo } from '@/types/database';
import { cn, formatBolivares, formatPrice } from '@/lib/utils';

interface DualPriceProps {
  amount: number;
  rate: UsdRateInfo | null;
  align?: 'start' | 'end';
  className?: string;
}

export function DualPrice({ amount, rate, align = 'end', className }: DualPriceProps) {
  return (
    <span
      className={cn(
        'flex flex-col gap-0.5 leading-tight',
        align === 'end' ? 'items-end' : 'items-start',
        className
      )}
    >
      <span>{formatPrice(amount)}</span>
      {rate && (
        <span className="text-[11px] font-medium text-brand-light/45">
          {formatBolivares(amount * rate.rate)}
        </span>
      )}
    </span>
  );
}

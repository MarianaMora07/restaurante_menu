'use client';

import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  label: string;
  title?: string;
  checked: boolean;
  disabled?: boolean;
  checkedClassName: string;
  onChange: () => void;
}

export function ToggleSwitch({
  label,
  title,
  checked,
  disabled,
  checkedClassName,
  onChange,
}: ToggleSwitchProps) {
  return (
    <label className="flex cursor-pointer items-center justify-end gap-2 select-none">
      <span className="text-xs font-medium text-brand-light/55">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        title={title}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50',
          checked ? cn(checkedClassName, 'text-brand-darker') : 'bg-white/15'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </label>
  );
}

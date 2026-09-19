'use client';

import { useCallback, useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import type { DeliveryZone } from '@/types/database';
import { saveDeliveryZones } from '@/app/actions/settings';
import { cn, formatPrice } from '@/lib/utils';

interface DeliveryZonesCardProps {
  zones: DeliveryZone[];
}

export function DeliveryZonesCard({ zones }: DeliveryZonesCardProps) {
  const [list, setList] = useState<DeliveryZone[]>(zones);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addZone = () => {
    const id = `zone-${Date.now()}`;
    setList((prev) => [...prev, { id, name: '', cost: 0 }]);
  };

  const removeZone = (id: string) => {
    setList((prev) => prev.filter((z) => z.id !== id));
  };

  const updateZone = (id: string, field: 'name' | 'cost', value: string) => {
    setList((prev) =>
      prev.map((z) =>
        z.id === id
          ? { ...z, [field]: field === 'cost' ? Math.round(Number(value) * 100) / 100 : value }
          : z
      )
    );
  };

  const handleSave = useCallback(async () => {
    const valid = list.filter((z) => z.name.trim() !== '');
    if (valid.length === 0) {
      setError('Agrega al menos una zona.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await saveDeliveryZones(valid);
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? 'Error desconocido');
      return;
    }
    setList(valid);
  }, [list]);

  return (
    <div className="rounded-2xl bg-brand-dark/80 p-5 ring-1 ring-brand-primary/20">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="size-4 text-brand-primary" aria-hidden />
        <h3 className="font-heading text-sm font-bold text-brand-light">Zonas de Delivery</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        {list.map((zone) => (
          <div key={zone.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nombre de la zona"
              value={zone.name}
              onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
              className="flex-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-brand-light ring-1 ring-white/10 placeholder:text-brand-light/30 focus:outline-none focus:ring-brand-primary/50"
            />
            <div className="relative w-28">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-brand-light/40">$</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={zone.cost || ''}
                onChange={(e) => updateZone(zone.id, 'cost', e.target.value)}
                className="w-full rounded-lg bg-white/[0.06] py-2 pl-7 pr-2 text-sm text-brand-light ring-1 ring-white/10 focus:outline-none focus:ring-brand-primary/50"
              />
            </div>
            <button
              type="button"
              onClick={() => removeZone(zone.id)}
              className="shrink-0 rounded-lg p-2 text-brand-light/30 transition-colors hover:bg-white/[0.06] hover:text-red-400"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addZone}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-semibold text-brand-light/60 transition-colors hover:bg-white/[0.1] hover:text-brand-light"
        >
          <Plus className="size-3.5" aria-hidden />
          Agregar zona
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className={cn(
            'rounded-lg px-4 py-2 text-xs font-bold transition-all',
            saving
              ? 'cursor-not-allowed bg-brand-primary/20 text-brand-light/30'
              : 'bg-brand-primary text-brand-darker hover:bg-brand-accent'
          )}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}

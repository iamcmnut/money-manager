'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserCar {
  id: string;
  carModelId: string;
  modelName: string | null;
  modelYear: number | null;
  brandName: string | null;
  nickname: string | null;
  isDefault: boolean;
}

interface CatalogModel {
  id: string;
  name: string;
  modelYear: number | null;
  batteryKwh: number | null;
}

interface CatalogBrand {
  id: string;
  name: string;
  models: CatalogModel[];
}

export function CarsSettings() {
  const [cars, setCars] = useState<UserCar[]>([]);
  const [catalog, setCatalog] = useState<CatalogBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCarBrandId, setNewCarBrandId] = useState('');
  const [newCarModelId, setNewCarModelId] = useState('');
  const [newCarNickname, setNewCarNickname] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [carsRes, catRes] = await Promise.all([
        fetch('/api/me/cars').then((r) => r.json() as Promise<{ cars: UserCar[] }>),
        fetch('/api/cars/catalog').then((r) => r.json() as Promise<{ brands: CatalogBrand[] }>),
      ]);
      setCars(carsRes.cars);
      setCatalog(catRes.brands);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addCar() {
    if (!newCarModelId) return;
    const res = await fetch('/api/me/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carModelId: newCarModelId, nickname: newCarNickname || undefined }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to add');
      return;
    }
    setAdding(false);
    setNewCarBrandId('');
    setNewCarModelId('');
    setNewCarNickname('');
    await refresh();
  }

  async function makeDefault(id: string) {
    await fetch(`/api/me/cars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    await refresh();
  }

  async function removeCar(id: string) {
    if (!confirm('Remove this car?')) return;
    const res = await fetch(`/api/me/cars/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to remove');
      return;
    }
    await refresh();
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading…</div>;

  const selectedBrand = catalog.find((b) => b.id === newCarBrandId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {cars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No cars yet. Add one to start logging charging records.
        </div>
      ) : (
        <ul className="space-y-2">
          {cars.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {c.brandName ?? '—'} {c.modelName ?? ''}
                  </span>
                  {c.isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Default
                    </span>
                  )}
                </div>
                {c.nickname && <div className="text-xs text-muted-foreground">&ldquo;{c.nickname}&rdquo;</div>}
              </div>
              <div className="flex items-center gap-2">
                {!c.isDefault && (
                  <Button size="sm" variant="outline" onClick={() => makeDefault(c.id)}>
                    <Star className="h-3.5 w-3.5" /> Set default
                  </Button>
                )}
                <button
                  type="button"
                  className="text-destructive hover:opacity-80"
                  onClick={() => removeCar(c.id)}
                  aria-label="Remove car"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <Button onClick={() => setAdding(true)} variant="outline">
          <Plus className="h-4 w-4" /> Add a car
        </Button>
      ) : (
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">Add car</h3>
          <div className="grid gap-3">
            <select
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={newCarBrandId}
              onChange={(e) => {
                setNewCarBrandId(e.target.value);
                setNewCarModelId('');
              }}
            >
              <option value="">Select brand…</option>
              {catalog.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={newCarModelId}
              onChange={(e) => setNewCarModelId(e.target.value)}
              disabled={!selectedBrand}
            >
              <option value="">Select model…</option>
              {selectedBrand?.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.modelYear ? ` (${m.modelYear})` : ''}
                  {m.batteryKwh ? ` · ${m.batteryKwh} kWh` : ''}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nickname (optional)"
              value={newCarNickname}
              onChange={(e) => setNewCarNickname(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={addCar} disabled={!newCarModelId}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface Model {
  id: string;
  brandId: string;
  brandName: string | null;
  name: string;
  modelYear: number | null;
  batteryKwh: number | null;
  isActive: boolean;
}

export function CarCatalogTab() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newBrand, setNewBrand] = useState({ name: '', slug: '' });
  const [newModel, setNewModel] = useState({ brandId: '', name: '', modelYear: '', batteryKwh: '' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [b, m] = await Promise.all([
        fetch('/api/admin/cars/brands').then((r) => r.json() as Promise<{ brands: Brand[] }>),
        fetch('/api/admin/cars/models').then((r) => r.json() as Promise<{ models: Model[] }>),
      ]);
      setBrands(b.brands);
      setModels(m.models);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addBrand() {
    if (!newBrand.name || !newBrand.slug) return;
    const res = await fetch('/api/admin/cars/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBrand),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to add brand');
      return;
    }
    setNewBrand({ name: '', slug: '' });
    await refresh();
  }

  async function deleteBrand(id: string) {
    if (!confirm(`Delete brand ${id}?`)) return;
    const res = await fetch(`/api/admin/cars/brands/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to delete');
      return;
    }
    await refresh();
  }

  async function addModel() {
    if (!newModel.brandId || !newModel.name) return;
    const res = await fetch('/api/admin/cars/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId: newModel.brandId,
        name: newModel.name,
        modelYear: newModel.modelYear ? Number(newModel.modelYear) : undefined,
        batteryKwh: newModel.batteryKwh ? Number(newModel.batteryKwh) : undefined,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to add model');
      return;
    }
    setNewModel({ brandId: newModel.brandId, name: '', modelYear: '', batteryKwh: '' });
    await refresh();
  }

  async function deleteModel(id: string) {
    if (!confirm(`Delete model ${id}?`)) return;
    const res = await fetch(`/api/admin/cars/models/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to delete');
      return;
    }
    await refresh();
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section>
        <h3 className="mb-3 text-base font-semibold">Brands ({brands.length})</h3>
        <div className="mb-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Brand name"
            value={newBrand.name}
            onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
          />
          <input
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="slug-kebab"
            value={newBrand.slug}
            onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })}
          />
          <Button onClick={addBrand} size="sm">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-3 py-2">{b.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{b.slug}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteBrand(b.id)}
                      className="text-destructive hover:opacity-80"
                      aria-label={`Delete ${b.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold">Models ({models.length})</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={newModel.brandId}
            onChange={(e) => setNewModel({ ...newModel, brandId: e.target.value })}
          >
            <option value="">Brand…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Model name"
            value={newModel.name}
            onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
          />
          <input
            className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Year"
            value={newModel.modelYear}
            onChange={(e) => setNewModel({ ...newModel, modelYear: e.target.value })}
          />
          <input
            className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="kWh"
            value={newModel.batteryKwh}
            onChange={(e) => setNewModel({ ...newModel, batteryKwh: e.target.value })}
          />
          <Button onClick={addModel} size="sm">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Battery (kWh)</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2">{m.brandName ?? m.brandId}</td>
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2">{m.modelYear ?? '—'}</td>
                  <td className="px-3 py-2">{m.batteryKwh ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteModel(m.id)}
                      className="text-destructive hover:opacity-80"
                      aria-label={`Delete ${m.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

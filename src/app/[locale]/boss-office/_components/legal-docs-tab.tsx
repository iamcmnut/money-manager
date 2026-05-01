'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface LegalDoc {
  id: string;
  type: 'terms' | 'privacy';
  locale: 'en' | 'th';
  version: number;
  content: string;
  effectiveAt: string;
  isActive: boolean;
}

export function LegalDocsTab() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LegalDoc | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/legal-documents');
      const json = (await res.json()) as { documents: LegalDoc[] };
      setDocs(json.documents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function activate(doc: LegalDoc) {
    const res = await fetch(`/api/admin/legal-documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });
    if (!res.ok) {
      setError('Failed to activate');
      return;
    }
    await refresh();
  }

  async function saveContent() {
    if (!editing) return;
    const res = await fetch(`/api/admin/legal-documents/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editing.content }),
    });
    if (!res.ok) {
      setError('Failed to save');
      return;
    }
    setEditing(null);
    await refresh();
  }

  async function publishNew(doc: LegalDoc) {
    const newVersion = doc.version + 1;
    const content = prompt(
      `New ${doc.type}/${doc.locale} version ${newVersion} markdown:`,
      doc.content,
    );
    if (!content) return;
    const res = await fetch('/api/admin/legal-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: doc.type,
        locale: doc.locale,
        version: newVersion,
        content,
        activate: true,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to publish');
      return;
    }
    await refresh();
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Locale</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-3 py-2 capitalize">{d.type}</td>
                <td className="px-3 py-2 uppercase">{d.locale}</td>
                <td className="px-3 py-2">v{d.version}</td>
                <td className="px-3 py-2">
                  {d.isActive ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Archived</span>
                  )}
                </td>
                <td className="space-x-2 px-3 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => setEditing(d)}>
                    Edit
                  </Button>
                  {!d.isActive && (
                    <Button size="sm" variant="outline" onClick={() => activate(d)}>
                      Activate
                    </Button>
                  )}
                  <Button size="sm" onClick={() => publishNew(d)}>
                    Publish v{d.version + 1}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="rounded-xl border border-border p-4">
          <h4 className="mb-2 text-sm font-semibold">
            Editing {editing.type}/{editing.locale} v{editing.version}
          </h4>
          <textarea
            className="h-96 w-full rounded-lg border border-input bg-background p-3 font-mono text-xs leading-relaxed"
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveContent}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function DangerZone() {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirmText !== 'DELETE') return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/me', { method: 'DELETE' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? 'Failed to delete account');
        return;
      }
      await signOut({ callbackUrl: '/' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="mb-2 text-base font-semibold text-destructive">Delete account</h2>
        <p className="mb-4 text-sm">
          Permanently delete your account, all charging records, photos, cars, and profile. This cannot be undone.
        </p>
        <label className="mb-3 block text-sm">
          Type <span className="font-mono font-bold">DELETE</span> to confirm:
          <input
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </label>
        {error && <div className="mb-3 text-sm text-destructive">{error}</div>}
        <Button variant="destructive" disabled={confirmText !== 'DELETE' || busy} onClick={deleteAccount}>
          {busy ? 'Deleting…' : 'Delete my account'}
        </Button>
      </section>
    </div>
  );
}

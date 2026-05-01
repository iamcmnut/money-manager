'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { validateSlugFormat } from '@/lib/slug';

interface ProfileResponse {
  profile: {
    id: string;
    email: string;
    publicSlug: string | null;
    displayName: string | null;
    expTotal: number;
    level: number;
    tier: string;
  };
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileResponse['profile'] | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/me/profile');
    if (!res.ok) return;
    const json = (await res.json()) as ProfileResponse;
    setProfile(json.profile);
    setDisplayName(json.profile.displayName ?? '');
    setSlug(json.profile.publicSlug ?? '');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const slugReason = slug && slug !== profile?.publicSlug ? validateSlugFormat(slug) : null;

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const body: Record<string, unknown> = {};
    if (displayName !== (profile?.displayName ?? '')) body.displayName = displayName || null;
    if (slug !== profile?.publicSlug) body.slug = slug;
    if (Object.keys(body).length === 0) {
      setSaving(false);
      return;
    }
    const res = await fetch('/api/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Failed to save');
      return;
    }
    setMessage('Saved');
    await refresh();
  }

  if (!profile) return <div className="animate-pulse text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-3 text-base font-semibold">Profile</h2>
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
            <input
              disabled
              className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm"
              value={profile.email}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Display name (shown on your public profile)
            </span>
            <input
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={displayName}
              maxLength={60}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Public slug (4–32 lowercase letters, digits, dashes)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/u/</span>
              <input
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
            </div>
            {slugReason && (
              <p className="mt-1 text-xs text-destructive">
                {slugReason === 'reserved'
                  ? 'This slug is reserved.'
                  : slugReason === 'leading-dash' || slugReason === 'trailing-dash' || slugReason === 'double-dash'
                    ? 'Dashes can only appear between characters.'
                    : 'Use 4–32 lowercase letters, digits, or dashes.'}
              </p>
            )}
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-3 text-base font-semibold">Level</h2>
        <p className="text-sm">
          <span className="font-mono">{profile.expTotal} EXP</span> · Level {profile.level} ·{' '}
          <span className="text-muted-foreground">{profile.tier}</span>
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || (slug !== profile.publicSlug && !!slugReason)}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, KeyRound, X, Check } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'user' | 'admin';
  createdAt: string | null;
}

interface UsersResponse {
  users?: UserData[];
  error?: string;
}

interface UpdateResponse {
  user?: UserData;
  error?: string;
}

function ResetPasswordForm({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const t = useTranslations('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('resetPassword.mismatch'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as UpdateResponse;

      if (response.ok) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        setError(data.error || t('resetPassword.failed'));
      }
    } catch {
      setError(t('resetPassword.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-lg border bg-background/80 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t('resetPassword.title')}</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {success ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          {t('resetPassword.success')}
        </div>
      ) : (
        <>
          <input
            type="password"
            placeholder={t('resetPassword.newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="password"
            placeholder={t('resetPassword.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={saving} className="w-full">
            {saving ? t('saving') : t('resetPassword.save')}
          </Button>
        </>
      )}
    </form>
  );
}

export function UsersTable() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = (await response.json()) as UsersResponse;

      if (response.ok && data.users) {
        setUsers(data.users);
      } else {
        setError(data.error || t('failedToLoadUsers'));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(t('failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleRole = async (userId: string, currentRole: 'user' | 'admin') => {
    setUpdatingId(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = (await response.json()) as UpdateResponse;

      if (response.ok && data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: data.user!.role } : u))
        );
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('loadingUsers')}</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (users.length === 0) {
    return <div className="text-sm text-muted-foreground">{t('noUsers')}</div>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id}>
          <div className="flex items-center justify-between rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
                <AvatarFallback className="bg-secondary text-foreground/70">
                  {user.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name || t('unknown')}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResetPasswordId(resetPasswordId === user.id ? null : user.id)}
                title={t('resetPassword.title')}
              >
                <KeyRound className="h-4 w-4" />
              </Button>
              <Button
                variant={user.role === 'admin' ? 'default' : 'outline'}
                size="sm"
                disabled={updatingId === user.id}
                onClick={() => toggleRole(user.id, user.role)}
                className={user.role === 'admin' ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600' : ''}
              >
                {updatingId === user.id ? '...' : user.role}
              </Button>
            </div>
          </div>
          {resetPasswordId === user.id && (
            <ResetPasswordForm
              userId={user.id}
              onClose={() => setResetPasswordId(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

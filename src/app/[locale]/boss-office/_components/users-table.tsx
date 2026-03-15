'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

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

export function UsersTable() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
              <AvatarFallback>
                {user.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.name || t('unknown')}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant={user.role === 'admin' ? 'default' : 'outline'}
            size="sm"
            disabled={updatingId === user.id}
            onClick={() => toggleRole(user.id, user.role)}
          >
            {updatingId === user.id ? '...' : user.role}
          </Button>
        </div>
      ))}
    </div>
  );
}

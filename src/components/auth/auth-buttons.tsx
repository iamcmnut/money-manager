'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';

interface AuthStatus {
  providers: {
    google: boolean;
    credentials: boolean;
  };
}

export function AuthButtons() {
  const t = useTranslations('auth');
  const { data: session, status } = useSession();
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json() as Promise<AuthStatus>)
      .then((data) => {
        // Auth is enabled if any provider is enabled
        setAuthEnabled(data.providers?.google || data.providers?.credentials || false);
      })
      .catch(() => {
        setAuthEnabled(false);
      });
  }, []);

  if (status === 'loading' || authEnabled === null) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (session?.user) {
    return <UserMenu />;
  }

  // Don't show sign-in button if no auth method is enabled
  if (!authEnabled) {
    return null;
  }

  return (
    <Button variant="outline" size="icon" className="md:w-auto md:px-4" asChild>
      <Link href="/auth/signin">
        <LogIn className="h-4 w-4" />
        <span className="hidden md:inline">{t('signIn')}</span>
      </Link>
    </Button>
  );
}

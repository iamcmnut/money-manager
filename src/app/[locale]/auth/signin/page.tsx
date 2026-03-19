'use client';

import { Suspense, useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface AuthStatus {
  providers: {
    google: boolean;
    credentials: boolean;
  };
  registration: boolean;
}

function SignInForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json() as Promise<AuthStatus>)
      .then((data) => {
        setAuthStatus(data);
      })
      .catch(() => {
        setAuthStatus({ providers: { google: false, credentials: false }, registration: false });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        // Register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = (await res.json()) as { error?: string; success?: boolean };

        if (!res.ok) {
          setError(data.error || t('registrationFailed'));
          return;
        }

        // Auto sign-in after registration
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError(t('accountCreated'));
          setIsRegister(false);
        } else {
          router.push(callbackUrl);
        }
      } else {
        // Sign in
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError(t('invalidCredentials'));
        } else {
          router.push(callbackUrl);
        }
      }
    } catch {
      setError(t('errorOccurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const hasAnyAuth = authStatus?.providers.google || authStatus?.providers.credentials;

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ) : !hasAnyAuth ? (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t('signInDisabled')}</p>
        </div>
      ) : (
        <>
          {/* Credentials Form */}
          {authStatus?.providers.credentials && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              {isRegister && (
                <input
                  type="text"
                  placeholder={t('name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              )}
              <input
                type="email"
                placeholder={t('email')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder={t('password')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />

              {error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('pleaseWait') : isRegister ? t('createAccount') : t('signIn')}
              </Button>

              {authStatus?.registration && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="w-full text-sm text-muted-foreground hover:underline"
                >
                  {isRegister ? t('hasAccount') : t('noAccount')}
                </button>
              )}
            </form>
          )}

          {/* Divider */}
          {authStatus?.providers.credentials && authStatus?.providers.google && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('or')}</span>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          {authStatus?.providers.google && (
            <Button type="button" variant="outline" onClick={handleGoogleSignIn} className="w-full">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('continueWithGoogle')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function SignInLoading() {
  return (
    <div className="space-y-3 p-6">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function SignInPage() {
  const t = useTranslations('auth');

  return (
    <div className="min-h-[80vh]">
      <div className="container flex min-h-[80vh] items-center justify-center py-8">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            {/* Logo */}
            <div className="mb-6 sm:mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">{t('signInTitle')}</h1>
              <p className="mt-1 text-sm text-muted-foreground text-center">{t('signInDescription')}</p>
            </div>

            <Suspense fallback={<SignInLoading />}>
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

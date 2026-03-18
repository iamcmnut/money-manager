'use client';

import { useTranslations } from 'next-intl';
import { Wallet } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Manager.money</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('contactUs')}{' '}
            <a
              href="mailto:info@manager.money"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              info@manager.money
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

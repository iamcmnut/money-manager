'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UserCircle, ShieldCheck, Car, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileSettings } from './profile-settings';
import { PrivacySettings } from './privacy-settings';
import { CarsSettings } from './cars-settings';
import { DangerZone } from './danger-zone';

const tabs = [
  { id: 'profile', icon: UserCircle, key: 'profile' },
  { id: 'privacy', icon: ShieldCheck, key: 'privacy' },
  { id: 'cars', icon: Car, key: 'cars' },
  { id: 'danger', icon: AlertTriangle, key: 'account' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function SettingsTabs({ locale }: { locale: string }) {
  const t = useTranslations('crowdData.settings.tabs');
  const [active, setActive] = useState<TabId>('profile');
  return (
    <div>
      <div role="tablist" className="mb-6 flex gap-1 rounded-xl bg-muted/50 p-1">
        {tabs.map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={active === id}
            onClick={() => setActive(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              active === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{t(key)}</span>
          </button>
        ))}
      </div>
      <div className="animate-slide-up-fade" key={active}>
        {active === 'profile' && <ProfileSettings />}
        {active === 'privacy' && <PrivacySettings locale={locale} />}
        {active === 'cars' && <CarsSettings />}
        {active === 'danger' && <DangerZone />}
      </div>
    </div>
  );
}

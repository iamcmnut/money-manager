'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Users, Zap, FileText, Flag, Tag, Mail, UserCircle, BadgeCheck } from 'lucide-react';
import { FeatureFlagsPanel } from './feature-flags';
import { UsersTable } from './users-table';
import { ChargingNetworksTable } from './charging-networks-table';
import { AdminChargingRecords } from './admin-charging-records';
import { CouponsTable } from './coupons-table';
import { cn } from '@/lib/utils';

type Session = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
};

const tabs = [
  { id: 'overview', icon: Shield },
  { id: 'users', icon: Users },
  { id: 'evNetworks', icon: Zap },
  { id: 'evRecords', icon: FileText },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function AdminTabs({ session }: { session: Session }) {
  const t = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div>
      {/* Tab bar */}
      <div role="tablist" className="mb-6 flex gap-1 rounded-xl bg-muted/50 p-1">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t(`tabs.${id}`)}</span>
            <span className="sr-only sm:hidden">{t(`tabs.${id}`)}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="animate-slide-up-fade" key={activeTab}>
        {activeTab === 'overview' && <OverviewTab session={session} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'evNetworks' && <EVNetworksTab />}
        {activeTab === 'evRecords' && <EVRecordsTab />}
      </div>
    </div>
  );
}

function OverviewTab({ session }: { session: Session }) {
  const t = useTranslations('admin');

  return (
    <div className="space-y-4">
      {/* Session info — compact inline */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{session.user.name ?? t('na')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate">{session.user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium capitalize text-primary">{session.user.role}</span>
        </div>
      </div>

      {/* Feature flags */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Flag className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">{t('featureFlags')}</h2>
            <p className="text-xs text-muted-foreground">{t('featureFlagsDescription')}</p>
          </div>
        </div>
        <FeatureFlagsPanel />
      </div>
    </div>
  );
}

function UsersTab() {
  const t = useTranslations('admin');

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold">{t('users')}</h2>
          <p className="text-xs text-muted-foreground">{t('usersDescription')}</p>
        </div>
      </div>
      <UsersTable />
    </div>
  );
}

function EVNetworksTab() {
  const t = useTranslations('admin');

  return (
    <div className="space-y-6">
      {/* Networks */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">{t('evNetworks.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('evNetworks.description')}</p>
          </div>
        </div>
        <ChargingNetworksTable />
      </div>

      {/* Coupons */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Tag className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">{t('coupons.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('coupons.description')}</p>
          </div>
        </div>
        <CouponsTable />
      </div>
    </div>
  );
}

function EVRecordsTab() {
  const t = useTranslations('admin');

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <FileText className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold">{t('chargingRecords.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('chargingRecords.description')}</p>
        </div>
      </div>
      <AdminChargingRecords />
    </div>
  );
}

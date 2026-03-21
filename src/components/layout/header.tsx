'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { LanguageSwitcher } from './language-switcher';
import { AuthButtons } from '@/components/auth/auth-buttons';
import { Wallet } from 'lucide-react';

export type EnabledModules = {
  ev: boolean;
  livingCost: boolean;
  savings: boolean;
};

type NavLink = {
  href: '/' | '/ev' | '/living-cost' | '/savings';
  labelKey: 'home' | 'ev' | 'livingCost' | 'savings';
  moduleKey?: keyof EnabledModules;
};

const navLinks: NavLink[] = [
  { href: '/', labelKey: 'home' },
  { href: '/ev', labelKey: 'ev', moduleKey: 'ev' },
  { href: '/living-cost', labelKey: 'livingCost', moduleKey: 'livingCost' },
  { href: '/savings', labelKey: 'savings', moduleKey: 'savings' },
];

type HeaderProps = {
  enabledModules: EnabledModules;
};

export function Header({ enabledModules }: HeaderProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const visibleLinks = navLinks.filter(
    (link) => !link.moduleKey || enabledModules[link.moduleKey]
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary transition-transform duration-200 hover:rotate-[-6deg]">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">
              Manager.money
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname === link.href
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
        <MobileNav enabledModules={enabledModules} />
        <div className="flex min-w-0 flex-1 items-center justify-between md:justify-end">
          <Link href="/" className="flex min-w-0 items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary transition-transform duration-200 hover:rotate-[-6deg]">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="truncate font-bold">Manager.money</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <AuthButtons />
          </nav>
        </div>
      </div>
    </header>
  );
}

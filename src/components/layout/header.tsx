'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { LanguageSwitcher } from './language-switcher';
import { AuthButtons } from '@/components/auth/auth-buttons';
import { Wallet } from 'lucide-react';

type NavLink = {
  href: '/' | '/ev' | '/living-cost' | '/savings';
  labelKey: 'home' | 'ev' | 'livingCost' | 'savings';
};

const navLinks: NavLink[] = [
  { href: '/', labelKey: 'home' },
  { href: '/ev', labelKey: 'ev' },
  { href: '/living-cost', labelKey: 'livingCost' },
  { href: '/savings', labelKey: 'savings' },
];

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-8 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-lg font-bold text-transparent">
              Manager.money
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname === link.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
        <MobileNav />
        <div className="flex min-w-0 flex-1 items-center justify-between md:justify-end">
          <Link href="/" className="flex min-w-0 items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
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

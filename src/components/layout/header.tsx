'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { LanguageSwitcher } from './language-switcher';
import { AuthButtons } from '@/components/auth/auth-buttons';

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Manager.money</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm lg:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
        <MobileNav />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none" />
          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <AuthButtons />
          </nav>
        </div>
      </div>
    </header>
  );
}

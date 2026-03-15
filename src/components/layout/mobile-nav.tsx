'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Menu, Wallet, Car, Home, PiggyBank, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type NavLink = {
  href: '/' | '/ev' | '/living-cost' | '/savings';
  labelKey: 'home' | 'ev' | 'livingCost' | 'savings';
  icon: React.ElementType;
  gradient: string;
};

const navLinks: NavLink[] = [
  { href: '/', labelKey: 'home', icon: Sparkles, gradient: 'from-primary to-primary/80' },
  { href: '/ev', labelKey: 'ev', icon: Car, gradient: 'from-blue-500 to-cyan-500' },
  { href: '/living-cost', labelKey: 'livingCost', icon: Home, gradient: 'from-orange-500 to-amber-500' },
  { href: '/savings', labelKey: 'savings', icon: PiggyBank, gradient: 'from-green-500 to-emerald-500' },
];

export function MobileNav() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader>
          <SheetTitle>
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Manager.money</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-3 transition-all',
                  pathname === link.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm',
                  link.gradient
                )}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">{t(link.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

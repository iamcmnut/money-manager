'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { locales, type Locale } from '@/i18n/config';

function USFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <g fillRule="evenodd">
        <g strokeWidth="1pt">
          <path fill="#bd3d44" d="M0 0h640v37h-640zm0 74h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640zm0-222h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640z"/>
          <path fill="#fff" d="M0 37h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640zm0-222h640v37h-640zm0 148h640v37h-640zm0 148h640v37h-640z"/>
        </g>
        <path fill="#192f5d" d="M0 0h260v259h-260z"/>
        <g fill="#fff">
          <g id="s18">
            <g id="s9">
              <g id="s5">
                <g id="s4">
                  <path id="s" d="M22 11.7l2.8 8.6h9.1l-7.4 5.4 2.8 8.6-7.3-5.3-7.3 5.3 2.8-8.6-7.4-5.4h9.1z"/>
                  <use xlinkHref="#s" y="42"/>
                  <use xlinkHref="#s" y="84"/>
                </g>
                <use xlinkHref="#s" y="126"/>
              </g>
              <use xlinkHref="#s4" y="168"/>
            </g>
            <use xlinkHref="#s9" x="42"/>
          </g>
          <use xlinkHref="#s18" x="84"/>
          <use xlinkHref="#s9" x="168"/>
          <use xlinkHref="#s5" x="210"/>
          <use xlinkHref="#s" x="210" y="168"/>
        </g>
      </g>
    </svg>
  );
}

function ThaiFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <g fillRule="evenodd">
        <path fill="#f4f5f8" d="M0 0h640v480H0z"/>
        <path fill="#2d2a4a" d="M0 162h640v160H0z"/>
        <path fill="#a51931" d="M0 0h640v82H0zm0 400h640v80H0z"/>
      </g>
    </svg>
  );
}

const FlagIcon = ({ locale, className }: { locale: Locale; className?: string }) => {
  switch (locale) {
    case 'en':
      return <USFlag className={className} />;
    case 'th':
      return <ThaiFlag className={className} />;
    default:
      return null;
  }
};

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('switchLanguage')}>
          <FlagIcon locale={locale} className="h-5 w-5 rounded-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchLocale(l)}
            className={locale === l ? 'bg-accent' : ''}
          >
            <FlagIcon locale={l} className="mr-2 h-4 w-4 rounded-sm" />
            {t(l)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

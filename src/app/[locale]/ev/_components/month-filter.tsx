'use client';

import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MonthFilterProps {
  months: string[];
  selectedMonth: string | null;
  onMonthChange: (month: string | null) => void;
}

export function MonthFilter({ months, selectedMonth, onMonthChange }: MonthFilterProps) {
  const t = useTranslations('modules.ev.filter');
  const locale = useLocale();

  const formatMonth = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      month: 'short',
      year: 'numeric',
    });
    return (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      return formatter.format(new Date(year, month - 1, 1));
    };
  }, [locale]);

  // Reverse so newest months appear first
  const sortedMonths = useMemo(() => [...months].reverse(), [months]);

  const triggerLabel = selectedMonth ? formatMonth(selectedMonth) : t('allTime');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1.5 font-normal',
            selectedMonth && 'text-module-ev'
          )}
        >
          <CalendarDays className="size-4" />
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
        <DropdownMenuItem
          onClick={() => onMonthChange(null)}
          className={cn(!selectedMonth && 'font-medium text-module-ev')}
        >
          {t('allTime')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {sortedMonths.map((month) => (
          <DropdownMenuItem
            key={month}
            onClick={() => onMonthChange(month)}
            className={cn(selectedMonth === month && 'font-medium text-module-ev')}
          >
            {formatMonth(month)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

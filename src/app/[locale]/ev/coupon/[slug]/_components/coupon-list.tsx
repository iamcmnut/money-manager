'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Tag, Copy, Check, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CouponData {
  id: string;
  code: string;
  descriptionEn: string | null;
  descriptionTh: string | null;
  conditionEn: string | null;
  conditionTh: string | null;
  startDate: string;
  endDate: string;
}

interface CouponListProps {
  coupons: CouponData[];
  brandColor: string | null;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function CouponList({ coupons, brandColor }: CouponListProps) {
  const t = useTranslations('modules.ev.coupon');
  const locale = useLocale();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">{t('noCoupons')}</p>
        <p className="text-sm mt-1">{t('noCouponsHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {coupons.map((coupon) => {
        const description = locale === 'th'
          ? coupon.descriptionTh || coupon.descriptionEn
          : coupon.descriptionEn || coupon.descriptionTh;

        const condition = locale === 'th'
          ? coupon.conditionTh || coupon.conditionEn
          : coupon.conditionEn || coupon.conditionTh;

        return (
          <div
            key={coupon.id}
            className="rounded-xl border bg-background/50 p-5 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
          >
            {/* Code + Copy */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" style={{ color: brandColor || undefined }} />
                <code className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                  {coupon.code}
                </code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCode(coupon.id, coupon.code)}
                className="text-xs"
              >
                {copiedId === coupon.id ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5 text-success" />
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    {t('copy')}
                  </>
                )}
              </Button>
            </div>

            {/* Description */}
            {description && (
              <p className="mt-3 text-sm">{description}</p>
            )}

            {/* Condition */}
            {condition && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('condition')}</p>
                  <p className="text-sm text-muted-foreground">{condition}</p>
                </div>
              </div>
            )}

            {/* Date range */}
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {t('validFrom')} {formatDate(coupon.startDate, locale)} — {t('validUntil')} {formatDate(coupon.endDate, locale)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

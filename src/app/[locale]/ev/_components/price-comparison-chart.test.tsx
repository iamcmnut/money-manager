import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BrandData } from './types';

const mockLocale = vi.hoisted(() => ({ value: 'en' }));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale.value,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock('@/lib/format', () => ({
  formatNumber: (n: number, decimals?: number) =>
    decimals !== undefined ? n.toFixed(decimals) : String(n),
  formatBaht: (n: number) => `฿${n}`,
}));

vi.mock('@/lib/sanitize-url', () => ({
  sanitizeUrl: (url: string) => (url.startsWith('http') ? url : null),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode;[key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('./daily-price-chart', () => ({
  NetworkDailyPriceChart: ({ networkName }: { networkName: string }) => (
    <div data-testid={`daily-chart-${networkName}`} />
  ),
}));

import { PriceComparisonChart } from './price-comparison-chart';

function makeBrand(overrides: Partial<BrandData> = {}): BrandData {
  return {
    brandId: 'test-brand',
    brandName: 'Test Brand',
    brandSlug: 'test-brand',
    brandColor: '#00A651',
    brandLogo: null,
    brandPhone: null,
    brandWebsite: null,
    sessions: 10,
    totalKwh: 100,
    totalCost: 500,
    avgPricePerKwh: 5.0,
    isCheapest: true,
    priceDiffPercent: 0,
    ...overrides,
  };
}

beforeEach(() => {
  // Mock requestAnimationFrame so mounted becomes true synchronously
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

describe('PriceComparisonChart', () => {
  describe('loading state', () => {
    it('shows loading skeleton', () => {
      const { container } = render(
        <PriceComparisonChart loading={true} error={null} />
      );
      const pulses = container.querySelectorAll('.animate-pulse');
      expect(pulses.length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      render(
        <PriceComparisonChart loading={false} error="Something went wrong" />
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows no data message when brandComparison is empty', () => {
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={[]} />
      );
      expect(screen.getByText('noData')).toBeInTheDocument();
      expect(screen.getByText('noDataHint')).toBeInTheDocument();
    });

    it('shows no data message when brandComparison is undefined', () => {
      render(
        <PriceComparisonChart loading={false} error={null} />
      );
      expect(screen.getByText('noData')).toBeInTheDocument();
    });
  });

  describe('brand rendering', () => {
    it('renders brand names sorted by price', () => {
      const brands = [
        makeBrand({ brandId: 'expensive', brandName: 'Expensive', avgPricePerKwh: 8, isCheapest: false, priceDiffPercent: 60 }),
        makeBrand({ brandId: 'cheap', brandName: 'Cheap', avgPricePerKwh: 5, isCheapest: true }),
      ];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );
      expect(screen.getByText('Cheap')).toBeInTheDocument();
      expect(screen.getByText('Expensive')).toBeInTheDocument();
    });

    it('shows brand logo when available', () => {
      const brands = [makeBrand({ brandLogo: '/logo.png' })];
      const { container } = render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );
      const img = container.querySelector('img[src="/logo.png"]');
      expect(img).toBeInTheDocument();
    });

    it('shows initial letter when no logo', () => {
      const brands = [makeBrand({ brandLogo: null, brandName: 'Volta' })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );
      expect(screen.getByText('V')).toBeInTheDocument();
    });

    it('shows rank badges', () => {
      const brands = [
        makeBrand({ brandId: 'a', brandName: 'A', avgPricePerKwh: 4 }),
        makeBrand({ brandId: 'b', brandName: 'B', avgPricePerKwh: 5, isCheapest: false }),
        makeBrand({ brandId: 'c', brandName: 'C', avgPricePerKwh: 6, isCheapest: false }),
      ];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );
      expect(screen.getByLabelText('Rank 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Rank 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Rank 3')).toBeInTheDocument();
    });

    it('shows cheapest label for cheapest brand', () => {
      const brands = [makeBrand({ isCheapest: true })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );
      // The cheapest text is in the expanded section, need to click to expand
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('expand/collapse', () => {
    it('toggles expand on click', async () => {
      const user = userEvent.setup();
      const brands = [makeBrand()];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );

      const button = screen.getByRole('button');
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('contact info', () => {
    it('shows phone link when available', async () => {
      const user = userEvent.setup();
      const brands = [makeBrand({ brandPhone: '02-123-4567' })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );

      await user.click(screen.getByRole('button'));
      expect(screen.getByText('02-123-4567')).toBeInTheDocument();
    });

    it('shows website link when available', async () => {
      const user = userEvent.setup();
      const brands = [makeBrand({ brandWebsite: 'https://example.com' })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} />
      );

      await user.click(screen.getByRole('button'));
      expect(screen.getByText('website')).toBeInTheDocument();
    });
  });

  describe('coupon badge', () => {
    it('does not show coupon badge when network has no active coupons', async () => {
      const user = userEvent.setup();
      const brands = [makeBrand({ brandSlug: 'test-brand' })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} couponNetworkSlugs={[]} />
      );

      await user.click(screen.getByRole('button', { name: /rank/i }));
      expect(screen.queryByText('hasCoupon')).not.toBeInTheDocument();
    });

    it('shows "Has Coupon" badge when network has active coupons', async () => {
      const user = userEvent.setup();
      const brands = [makeBrand({ brandSlug: 'test-brand' })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} couponNetworkSlugs={['test-brand']} />
      );

      await user.click(screen.getByLabelText('Rank 1'));
      expect(screen.getByText('hasCoupon')).toBeInTheDocument();
    });

    it('coupon badge links to coupon page', async () => {
      const user = userEvent.setup();
      const brands = [makeBrand({ brandSlug: 'test-brand' })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} couponNetworkSlugs={['test-brand']} />
      );

      await user.click(screen.getByLabelText('Rank 1'));
      const link = screen.getByText('hasCoupon').closest('a');
      expect(link).toHaveAttribute('href', '/ev/coupon/test-brand');
    });

    it('does not show coupon badge when showCoupon is false', async () => {
      const user = userEvent.setup();
      const brands = [makeBrand({ brandSlug: 'test-brand' })];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} showCoupon={false} couponNetworkSlugs={['test-brand']} />
      );

      await user.click(screen.getByRole('button', { name: /rank/i }));
      expect(screen.queryByText('hasCoupon')).not.toBeInTheDocument();
    });

    it('does not show coupon badge for network not in couponNetworkSlugs', async () => {
      const user = userEvent.setup();
      const brands = [
        makeBrand({ brandId: 'brand-b', brandName: 'Brand B', brandSlug: 'brand-b', avgPricePerKwh: 6, isCheapest: true }),
      ];
      render(
        <PriceComparisonChart loading={false} error={null} brandComparison={brands} couponNetworkSlugs={['brand-a']} />
      );

      await user.click(screen.getByRole('button', { name: /rank/i }));
      expect(screen.queryByText('hasCoupon')).not.toBeInTheDocument();
    });
  });
});

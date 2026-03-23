import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// --- Mocks ---

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

const mockGetFeatureFlag = vi.fn();
vi.mock('@/lib/feature-flags', () => ({
  getFeatureFlag: (flag: string) => mockGetFeatureFlag(flag),
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('../_components/charging-records-list', () => ({
  ChargingRecordsList: () => <div data-testid="charging-records-list">Records List</div>,
}));

// Need to mock FeatureGate as an async server component
vi.mock('@/components/feature-gate', () => ({
  FeatureGate: ({ flag, children }: { flag: string; children: React.ReactNode }) => {
    // Simple sync mock: always render children (feature flag tests are separate)
    return <>{children}</>;
  },
}));

import EVHistoryPage from './page';

// --- Tests ---

describe('EVHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFeatureFlag.mockResolvedValue(true);
  });

  describe('Authentication', () => {
    it('should redirect to signin when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(
        EVHistoryPage({ params: Promise.resolve({ locale: 'en' }) })
      ).rejects.toThrow('REDIRECT:/en/auth/signin?callbackUrl=/en/ev/history');

      expect(mockRedirect).toHaveBeenCalledWith('/en/auth/signin?callbackUrl=/en/ev/history');
    });

    it('should redirect to signin when session has no user', async () => {
      mockAuth.mockResolvedValue({});

      await expect(
        EVHistoryPage({ params: Promise.resolve({ locale: 'en' }) })
      ).rejects.toThrow('REDIRECT');
    });

    it('should redirect with correct locale (th)', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(
        EVHistoryPage({ params: Promise.resolve({ locale: 'th' }) })
      ).rejects.toThrow('REDIRECT:/th/auth/signin?callbackUrl=/th/ev/history');
    });

    it('should not redirect when user is authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'user' },
      });

      const result = await EVHistoryPage({ params: Promise.resolve({ locale: 'en' }) });
      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Feature gate', () => {
    it('should wrap content in FeatureGate with ev_history flag', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'user' },
      });

      const result = await EVHistoryPage({ params: Promise.resolve({ locale: 'en' }) });
      // The result should be a FeatureGate component
      expect(result).toBeDefined();
      // Check the props of the returned element
      expect(result.props.flag).toBe('ev_history');
    });
  });

  describe('Rendering', () => {
    it('should render page content for authenticated user', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', role: 'user' },
      });

      const Page = await EVHistoryPage({ params: Promise.resolve({ locale: 'en' }) });
      render(Page);

      expect(screen.getByText('historyPage.title')).toBeInTheDocument();
      expect(screen.getByText('historyPage.description')).toBeInTheDocument();
      expect(screen.getByTestId('charging-records-list')).toBeInTheDocument();
    });
  });
});

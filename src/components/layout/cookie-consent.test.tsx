import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from './cookie-consent';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders banner when no consent stored (pending state)', () => {
    render(<CookieConsent />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByText('accept')).toBeInTheDocument();
    expect(screen.getByText('decline')).toBeInTheDocument();
  });

  it('does not render when consent is accepted', () => {
    localStorageMock.setItem('cookie-consent', 'accepted');
    const { container } = render(<CookieConsent />);
    expect(container.innerHTML).toBe('');
  });

  it('does not render when consent is declined', () => {
    localStorageMock.setItem('cookie-consent', 'declined');
    const { container } = render(<CookieConsent />);
    expect(container.innerHTML).toBe('');
  });

  it('clicking accept button stores accepted and hides banner', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByText('accept'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('cookie-consent', 'accepted');
    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });

  it('clicking decline button stores declined and hides banner', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByText('decline'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('cookie-consent', 'declined');
    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });
});

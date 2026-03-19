import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockUseSession = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

import { AuthButtons } from './auth-buttons';

beforeEach(() => {
  vi.mocked(global.fetch).mockReset();
});

global.fetch = vi.fn();

describe('AuthButtons', () => {
  it('shows loading state initially', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ providers: { google: true, credentials: false } }),
    });

    const { container } = render(<AuthButtons />);
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).toBeInTheDocument();
  });

  it('renders UserMenu when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User' } },
      status: 'authenticated',
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ providers: { google: true, credentials: false } }),
    });

    render(<AuthButtons />);

    await waitFor(() => {
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  it('renders login button when unauthenticated and auth enabled', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ providers: { google: true, credentials: false } }),
    });

    render(<AuthButtons />);

    await waitFor(() => {
      expect(screen.getByText('signIn')).toBeInTheDocument();
    });
  });

  it('renders nothing when auth is disabled', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ providers: { google: false, credentials: false } }),
    });

    const { container } = render(<AuthButtons />);

    await waitFor(() => {
      const pulse = container.querySelector('.animate-pulse');
      expect(pulse).not.toBeInTheDocument();
    });

    expect(screen.queryByText('signIn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { container } = render(<AuthButtons />);

    await waitFor(() => {
      const pulse = container.querySelector('.animate-pulse');
      expect(pulse).not.toBeInTheDocument();
    });

    // When fetch fails, authEnabled is set to false, so nothing renders
    expect(screen.queryByText('signIn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });
});

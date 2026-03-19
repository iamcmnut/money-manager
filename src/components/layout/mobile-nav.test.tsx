import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  usePathname: vi.fn(() => '/'),
}));

import { MobileNav } from './mobile-nav';

describe('MobileNav', () => {
  it('renders menu trigger button', () => {
    render(<MobileNav />);
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    expect(trigger).toBeInTheDocument();
  });

  it('trigger button is accessible', () => {
    render(<MobileNav />);
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    expect(trigger).toBeInTheDocument();
    // The sr-only span provides accessible text
    expect(trigger).toHaveAccessibleName('Toggle menu');
  });

  it('renders navigation link items when opened', async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(trigger);

    // The nav links use translation keys as text
    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(screen.getByText('ev')).toBeInTheDocument();
    expect(screen.getByText('livingCost')).toBeInTheDocument();
    expect(screen.getByText('savings')).toBeInTheDocument();
  });
});

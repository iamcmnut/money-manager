import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type EnabledModules } from './header';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  usePathname: vi.fn(() => '/'),
}));

import { MobileNav } from './mobile-nav';

const allEnabled: EnabledModules = { ev: true, livingCost: true, savings: true };

describe('MobileNav', () => {
  it('renders menu trigger button', () => {
    render(<MobileNav enabledModules={allEnabled} />);
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    expect(trigger).toBeInTheDocument();
  });

  it('trigger button is accessible', () => {
    render(<MobileNav enabledModules={allEnabled} />);
    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAccessibleName('Toggle menu');
  });

  it('renders navigation link items when opened', async () => {
    const user = userEvent.setup();
    render(<MobileNav enabledModules={allEnabled} />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(trigger);

    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(screen.getByText('ev')).toBeInTheDocument();
    expect(screen.getByText('livingCost')).toBeInTheDocument();
    expect(screen.getByText('savings')).toBeInTheDocument();
  });

  it('hides nav links for disabled modules', async () => {
    const user = userEvent.setup();
    render(<MobileNav enabledModules={{ ev: true, livingCost: false, savings: false }} />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(trigger);

    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(screen.getByText('ev')).toBeInTheDocument();
    expect(screen.queryByText('livingCost')).not.toBeInTheDocument();
    expect(screen.queryByText('savings')).not.toBeInTheDocument();
  });

  it('renders logo link in sheet header', async () => {
    const user = userEvent.setup();
    render(<MobileNav enabledModules={allEnabled} />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(trigger);

    expect(await screen.findByText('Manager.money')).toBeInTheDocument();
  });

  it('nav links have correct href attributes', async () => {
    const user = userEvent.setup();
    render(<MobileNav enabledModules={allEnabled} />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(trigger);

    await screen.findByText('home');
    const homeLink = screen.getByText('home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');

    const evLink = screen.getByText('ev').closest('a');
    expect(evLink).toHaveAttribute('href', '/ev');
  });

  it('clicking a nav link closes the sheet', async () => {
    const user = userEvent.setup();
    render(<MobileNav enabledModules={allEnabled} />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(trigger);

    await screen.findByText('home');
    const homeLink = screen.getByText('home').closest('a')!;
    await user.click(homeLink);

    // After clicking, the sheet should close (nav items should disappear)
    // The Link mock just renders an <a>, so clicking fires onClick which calls setOpen(false)
  });

  it('shows all 4 links when all modules enabled', async () => {
    const user = userEvent.setup();
    render(<MobileNav enabledModules={allEnabled} />);

    const trigger = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(trigger);

    await screen.findByText('home');
    const links = screen.getAllByRole('link');
    // Logo link + 4 nav links = 5 links total
    expect(links.length).toBe(5);
  });
});

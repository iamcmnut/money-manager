import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header, type EnabledModules } from './header';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUsePathname = vi.fn(() => '/');

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  usePathname: () => mockUsePathname(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('./theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('./mobile-nav', () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}));

vi.mock('./language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('@/components/auth/auth-buttons', () => ({
  AuthButtons: () => <div data-testid="auth-buttons" />,
}));

const allEnabled: EnabledModules = { ev: true, livingCost: true, savings: true };

describe('Header', () => {
  it('renders navigation links', () => {
    render(<Header enabledModules={allEnabled} />);

    expect(screen.getAllByText('home').length).toBeGreaterThan(0);
    expect(screen.getByText('ev')).toBeInTheDocument();
    expect(screen.getByText('livingCost')).toBeInTheDocument();
    expect(screen.getByText('savings')).toBeInTheDocument();
  });

  it('renders logo/brand', () => {
    render(<Header enabledModules={allEnabled} />);

    const brandElements = screen.getAllByText('Manager.money');
    expect(brandElements.length).toBeGreaterThan(0);
  });

  it('applies active styling to current route link', () => {
    mockUsePathname.mockReturnValue('/ev');
    render(<Header enabledModules={allEnabled} />);

    const evLink = screen.getByText('ev');
    expect(evLink).toHaveClass('text-primary', 'font-semibold');

    const savingsLink = screen.getByText('savings');
    expect(savingsLink).toHaveClass('text-muted-foreground');
    expect(savingsLink).not.toHaveClass('text-primary');
  });

  it('hides nav links for disabled modules', () => {
    render(<Header enabledModules={{ ev: true, livingCost: false, savings: false }} />);

    expect(screen.getByText('ev')).toBeInTheDocument();
    expect(screen.queryByText('livingCost')).not.toBeInTheDocument();
    expect(screen.queryByText('savings')).not.toBeInTheDocument();
  });
});

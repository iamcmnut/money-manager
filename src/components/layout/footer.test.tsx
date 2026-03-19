import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { Footer } from './footer';

describe('Footer', () => {
  it('renders a footer element', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders brand text', () => {
    render(<Footer />);
    expect(screen.getByText('Manager.money')).toBeInTheDocument();
  });

  it('renders contact email link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'info@manager.money' });
    expect(link).toHaveAttribute('href', 'mailto:info@manager.money');
  });
});

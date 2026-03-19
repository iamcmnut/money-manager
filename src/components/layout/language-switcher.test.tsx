import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockReplace = vi.fn();
const mockUseLocale = vi.fn(() => 'en');

vi.mock('next-intl', () => ({
  useLocale: () => mockUseLocale(),
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/',
}));

import { LanguageSwitcher } from './language-switcher';

beforeEach(() => {
  mockReplace.mockReset();
  localStorage.clear();
});

describe('LanguageSwitcher', () => {
  it('renders current locale indicator', () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByRole('button', { name: 'switchLanguage' });
    expect(trigger).toBeInTheDocument();
  });

  it('renders all available locale options', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const trigger = screen.getByRole('button', { name: 'switchLanguage' });
    await user.click(trigger);

    // Both locale keys should be rendered as menu items
    const enOption = await screen.findByText('en');
    const thOption = await screen.findByText('th');
    expect(enOption).toBeInTheDocument();
    expect(thOption).toBeInTheDocument();
  });

  it('switching locale calls router.replace', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const trigger = screen.getByRole('button', { name: 'switchLanguage' });
    await user.click(trigger);

    const thOption = await screen.findByText('th');
    await user.click(thOption);

    expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'th' });
  });

  it('stores locale preference in localStorage', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const trigger = screen.getByRole('button', { name: 'switchLanguage' });
    await user.click(trigger);

    const thOption = await screen.findByText('th');
    await user.click(thOption);

    expect(localStorage.getItem('preferred-locale')).toBe('th');
  });
});

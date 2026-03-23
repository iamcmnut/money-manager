import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { mockSetTheme } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
}));
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: mockSetTheme }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
  });

  it('renders dropdown with theme options when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(screen.getByRole('menuitem', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'System' })).toBeInTheDocument();
  });

  it('calls setTheme with dark when Dark is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await user.click(screen.getByRole('menuitem', { name: 'Dark' }));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with light when Light is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await user.click(screen.getByRole('menuitem', { name: 'Light' }));

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with system when System is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await user.click(screen.getByRole('menuitem', { name: 'System' }));

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});

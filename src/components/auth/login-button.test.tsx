import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));
vi.mock('next-auth/react', () => ({
  signIn: mockSignIn,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { LoginButton } from './login-button';

describe('LoginButton', () => {
  it('renders login button', () => {
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('calls signIn on click', async () => {
    const user = userEvent.setup();
    render(<LoginButton />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(mockSignIn).toHaveBeenCalledWith('google');
  });
});

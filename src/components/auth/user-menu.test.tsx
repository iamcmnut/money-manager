import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from './user-menu';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockedUseSession = vi.mocked(useSession);

function mockSession(overrides: {
  name?: string | null;
  email?: string;
  image?: string | null;
  role?: string;
}) {
  mockedUseSession.mockReturnValue({
    data: {
      user: {
        name: overrides.name ?? 'John Doe',
        email: overrides.email ?? 'john@example.com',
        image: overrides.image ?? null,
        role: overrides.role ?? 'user',
      },
      expires: '2099-01-01',
    },
    status: 'authenticated',
    update: vi.fn(),
  });
}

async function openMenu() {
  const user = userEvent.setup();
  const trigger = screen.getByRole('button');
  await user.click(trigger);
}

describe('UserMenu', () => {
  it('renders user name and email', async () => {
    mockSession({ name: 'John Doe', email: 'john@example.com' });
    render(<UserMenu />);
    await openMenu();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays initials correctly', () => {
    mockSession({ name: 'John Doe' });
    render(<UserMenu />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows admin link when user role is admin', async () => {
    mockSession({ name: 'Admin User', role: 'admin' });
    render(<UserMenu />);
    await openMenu();

    expect(screen.getByText('user.adminPanel')).toBeInTheDocument();
  });

  it('does not show admin link for regular user', async () => {
    mockSession({ name: 'Regular User', role: 'user' });
    render(<UserMenu />);
    await openMenu();

    expect(screen.queryByText('user.adminPanel')).not.toBeInTheDocument();
  });

  it('handles missing name gracefully', async () => {
    mockSession({ name: null, email: 'noname@example.com' });
    const { container } = render(<UserMenu />);
    await openMenu();

    expect(screen.getByText('noname@example.com')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});

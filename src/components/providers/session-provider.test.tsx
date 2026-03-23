import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

import { SessionProvider } from './session-provider';

describe('SessionProvider', () => {
  it('renders children', () => {
    render(
      <SessionProvider>
        <span>Child content</span>
      </SessionProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('wraps children with NextAuth SessionProvider', () => {
    render(
      <SessionProvider>
        <span>Test</span>
      </SessionProvider>
    );
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
  });
});

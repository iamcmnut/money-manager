import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

import { ThemeProvider } from './theme-provider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <span>Child content</span>
      </ThemeProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('wraps children with NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <span>Test</span>
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });

  it('passes correct theme configuration', () => {
    render(
      <ThemeProvider>
        <span>Test</span>
      </ThemeProvider>
    );
    const provider = screen.getByTestId('theme-provider');
    const props = JSON.parse(provider.getAttribute('data-props')!);
    expect(props.attribute).toBe('class');
    expect(props.defaultTheme).toBe('light');
    expect(props.enableSystem).toBe(true);
    expect(props.disableTransitionOnChange).toBe(true);
  });
});

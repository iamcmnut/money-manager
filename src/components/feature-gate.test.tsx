import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockGetFeatureFlag } = vi.hoisted(() => ({
  mockGetFeatureFlag: vi.fn(),
}));
vi.mock('@/lib/feature-flags', () => ({
  getFeatureFlag: mockGetFeatureFlag,
}));

import { FeatureGate } from './feature-gate';

// FeatureGate is an async server component, so we resolve its output
// by calling it as a function and rendering the returned JSX.
async function renderFeatureGate(props: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const jsx = await FeatureGate(props as Parameters<typeof FeatureGate>[0]);
  render(<>{jsx}</>);
}

describe('FeatureGate', () => {
  it('renders children when feature flag is enabled', async () => {
    mockGetFeatureFlag.mockResolvedValue(true);

    await renderFeatureGate({
      flag: 'module_ev',
      children: <div>Feature content</div>,
    });

    expect(screen.getByText('Feature content')).toBeInTheDocument();
  });

  it('renders fallback when feature flag is disabled', async () => {
    mockGetFeatureFlag.mockResolvedValue(false);

    await renderFeatureGate({
      flag: 'module_ev',
      children: <div>Feature content</div>,
      fallback: <div>Fallback content</div>,
    });

    expect(screen.queryByText('Feature content')).not.toBeInTheDocument();
    expect(screen.getByText('Fallback content')).toBeInTheDocument();
  });

  it('renders nothing when flag is disabled and no fallback', async () => {
    mockGetFeatureFlag.mockResolvedValue(false);

    const { container } = render(<></>);
    const jsx = await FeatureGate({
      flag: 'module_ev' as Parameters<typeof FeatureGate>[0]['flag'],
      children: <div>Feature content</div>,
    });
    render(<>{jsx}</>, { container });

    expect(screen.queryByText('Feature content')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- Mocks ---

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-count={data?.length ?? 0}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

global.fetch = vi.fn();

import { NetworkDailyPriceChart } from './daily-price-chart';

// --- Helpers ---

const mockResponse = (data: object, ok = true, status = 200) => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
};

const sampleApiData = {
  dailyPrices: [
    { date: '2026-03-01', 'PEA Volta': 5.5, 'EA Anywhere': 6.2 },
    { date: '2026-03-02', 'PEA Volta': 5.3, 'EA Anywhere': 6.0 },
    { date: '2026-03-03', 'PEA Volta': 5.7 },
  ],
  networks: [
    { name: 'PEA Volta', color: '#00A651' },
    { name: 'EA Anywhere', color: '#FF6B00' },
  ],
};

const defaultProps = {
  networkName: 'PEA Volta',
  brandColor: '#00A651',
};

// --- Tests ---

beforeEach(() => {
  vi.mocked(global.fetch).mockReset();
});

describe('NetworkDailyPriceChart', () => {
  describe('loading state', () => {
    it('shows loading skeleton initially', () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      const { container } = render(<NetworkDailyPriceChart {...defaultProps} />);

      const pulses = container.querySelectorAll('.animate-pulse');
      expect(pulses.length).toBeGreaterThan(0);
    });

    it('does not render chart while loading', () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      render(<NetworkDailyPriceChart {...defaultProps} />);

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
    });

    it('shows error message when API returns non-ok', async () => {
      mockResponse({ error: 'Server error' }, false, 500);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
    });

    it('does not render chart on error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows no-data message when API returns empty', async () => {
      mockResponse({ dailyPrices: [], networks: [] });

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
    });

    it('shows no-data when network has only one data point', async () => {
      mockResponse({
        dailyPrices: [{ date: '2026-03-01', 'PEA Volta': 5.5 }],
        networks: [{ name: 'PEA Volta', color: '#00A651' }],
      });

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
    });

    it('shows no-data when network is not in the response', async () => {
      mockResponse({
        dailyPrices: [
          { date: '2026-03-01', 'EA Anywhere': 6.2 },
          { date: '2026-03-02', 'EA Anywhere': 6.0 },
        ],
        networks: [{ name: 'EA Anywhere', color: '#FF6B00' }],
      });

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
    });

    it('does not render chart in empty state', async () => {
      mockResponse({ dailyPrices: [], networks: [] });

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('data filtering and rendering', () => {
    it('renders chart when network has 2+ data points', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('filters data to only the specified network', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        // PEA Volta has 3 data points in sampleApiData
        expect(screen.getByTestId('line-chart').getAttribute('data-count')).toBe('3');
      });
    });

    it('renders only one Line with dataKey "price"', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-price')).toBeInTheDocument();
      });
    });

    it('uses the brand color for the line stroke', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-price').getAttribute('data-stroke')).toBe('#00A651');
      });
    });

    it('uses custom brand color when provided', async () => {
      mockResponse(sampleApiData);

      render(
        <NetworkDailyPriceChart networkName="EA Anywhere" brandColor="#FF6B00" />
      );

      await waitFor(() => {
        expect(screen.getByTestId('line-price').getAttribute('data-stroke')).toBe('#FF6B00');
      });
    });

    it('renders chart axes', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      });
    });

    it('renders tooltip', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      });
    });

    it('renders in responsive container', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });
    });

    it('filters correctly for EA Anywhere network', async () => {
      mockResponse(sampleApiData);

      render(
        <NetworkDailyPriceChart networkName="EA Anywhere" brandColor="#FF6B00" />
      );

      await waitFor(() => {
        // EA Anywhere has 2 data points (not present on 2026-03-03)
        expect(screen.getByTestId('line-chart').getAttribute('data-count')).toBe('2');
      });
    });

    it('handles network with data on all dates', async () => {
      const data = {
        dailyPrices: [
          { date: '2026-03-01', Solo: 5.0 },
          { date: '2026-03-02', Solo: 5.5 },
          { date: '2026-03-03', Solo: 6.0 },
          { date: '2026-03-04', Solo: 5.8 },
        ],
        networks: [{ name: 'Solo', color: '#123' }],
      };
      mockResponse(data);

      render(<NetworkDailyPriceChart networkName="Solo" brandColor="#123" />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart').getAttribute('data-count')).toBe('4');
      });
    });
  });

  describe('date range selector', () => {
    it('renders all range buttons', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      // Range buttons should be visible even during loading
      expect(screen.getByText('range30')).toBeInTheDocument();
      expect(screen.getByText('range90')).toBeInTheDocument();
      expect(screen.getByText('rangeAll')).toBeInTheDocument();
    });

    it('defaults to 90d range', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=90', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      });
    });

    it('fetches with range=30 when clicked', async () => {
      const user = userEvent.setup();
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      await user.click(screen.getByText('range30'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=30', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      });
    });

    it('fetches with range=all when clicked', async () => {
      const user = userEvent.setup();
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      await user.click(screen.getByText('rangeAll'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=all', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      });
    });

    it('switching range triggers new fetch', async () => {
      const user = userEvent.setup();
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      await user.click(screen.getByText('range30'));

      await waitFor(() => {
        const callsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
        expect(callsAfter).toBeGreaterThan(callsBefore);
        const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
        expect(lastCall?.[0]).toBe('/api/ev/stats/daily-prices?range=30');
      });
    });

    it('switching back re-fetches with correct URL', async () => {
      const user = userEvent.setup();
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      await user.click(screen.getByText('range30'));
      await waitFor(() => {
        const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
        expect(lastCall?.[0]).toBe('/api/ev/stats/daily-prices?range=30');
      });

      await user.click(screen.getByText('range90'));
      await waitFor(() => {
        const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
        expect(lastCall?.[0]).toBe('/api/ev/stats/daily-prices?range=90');
      });
    });
  });

  describe('active range styling', () => {
    it('highlights the active range button (90d by default)', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        const btn90 = screen.getByText('range90');
        expect(btn90.className).toContain('bg-background');
      });
    });

    it('non-active buttons have muted styling', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        const btn30 = screen.getByText('range30');
        expect(btn30.className).toContain('text-muted-foreground');
      });
    });

    it('updates active style on range change', async () => {
      const user = userEvent.setup();
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      await user.click(screen.getByText('range30'));

      await waitFor(() => {
        expect(screen.getByText('range30').className).toContain('bg-background');
        expect(screen.getByText('range90').className).toContain('text-muted-foreground');
      });
    });
  });

  describe('title', () => {
    it('shows chart title label', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('click propagation', () => {
    it('range buttons have type="button"', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('fetch behavior', () => {
    it('calls the correct API endpoint on mount', async () => {
      mockResponse(sampleApiData);

      render(<NetworkDailyPriceChart {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=90', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      });
    });

    it('transitions from loading to chart', async () => {
      let resolveFetch: (value: unknown) => void;
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const { container } = render(<NetworkDailyPriceChart {...defaultProps} />);

      // Loading
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      // Resolve
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve(sampleApiData),
      });

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('transitions from loading to error', async () => {
      let rejectFetch: (reason: unknown) => void;
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((_, reject) => {
          rejectFetch = reject;
        })
      );

      const { container } = render(<NetworkDailyPriceChart {...defaultProps} />);

      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      rejectFetch!(new Error('fail'));

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
    });

    it('transitions from loading to empty', async () => {
      let resolveFetch: (value: unknown) => void;
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      render(<NetworkDailyPriceChart {...defaultProps} />);

      resolveFetch!({
        ok: true,
        json: () => Promise.resolve({ dailyPrices: [], networks: [] }),
      });

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
    });
  });

  describe('different networks', () => {
    it('works with a network that has sparse data', async () => {
      const data = {
        dailyPrices: [
          { date: '2026-03-01', Sparse: 4.0 },
          { date: '2026-03-05', Sparse: 4.5 },
        ],
        networks: [{ name: 'Sparse', color: '#abc' }],
      };
      mockResponse(data);

      render(<NetworkDailyPriceChart networkName="Sparse" brandColor="#abc" />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart').getAttribute('data-count')).toBe('2');
      });
    });

    it('handles network name with special characters', async () => {
      const data = {
        dailyPrices: [
          { date: '2026-03-01', 'Net (TH)': 5.0 },
          { date: '2026-03-02', 'Net (TH)': 5.5 },
        ],
        networks: [{ name: 'Net (TH)', color: '#999' }],
      };
      mockResponse(data);

      render(<NetworkDailyPriceChart networkName="Net (TH)" brandColor="#999" />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- Mocks ---

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock recharts — render data attributes so we can assert on structure
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
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

global.fetch = vi.fn();

import { DailyPriceChart } from './daily-price-chart';

// --- Helpers ---

const mockResponse = (data: object, ok = true, status = 200) => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
};

const sampleData = {
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

// --- Tests ---

beforeEach(() => {
  vi.mocked(global.fetch).mockReset();
});

describe('DailyPriceChart', () => {
  describe('loading state', () => {
    it('shows loading skeleton initially', () => {
      // Never resolve fetch to keep loading state
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      const { container } = render(<DailyPriceChart />);

      const pulses = container.querySelectorAll('.animate-pulse');
      expect(pulses.length).toBeGreaterThan(0);
    });

    it('does not render chart while loading', () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

      render(<DailyPriceChart />);

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
    });

    it('shows error message when API returns error', async () => {
      mockResponse({ error: 'Server error' }, false, 500);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('shows fallback error text when API error has no message', async () => {
      mockResponse({}, false, 500);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
    });

    it('does not render chart on error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('failedToLoad')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no data', async () => {
      mockResponse({ dailyPrices: [], networks: [] });

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
      expect(screen.getByText('noDataHint')).toBeInTheDocument();
    });

    it('shows empty state when only one data point', async () => {
      mockResponse({
        dailyPrices: [{ date: '2026-03-01', Net: 5 }],
        networks: [{ name: 'Net', color: '#000' }],
      });

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
    });

    it('does not render chart on empty state', async () => {
      mockResponse({ dailyPrices: [], networks: [] });

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('noData')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('shows title in empty state', async () => {
      mockResponse({ dailyPrices: [], networks: [] });

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
      });
    });
  });

  describe('data rendering', () => {
    it('renders chart with data', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('renders title and description', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('description')).toBeInTheDocument();
      });
    });

    it('renders a Line for each network', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-PEA Volta')).toBeInTheDocument();
        expect(screen.getByTestId('line-EA Anywhere')).toBeInTheDocument();
      });
    });

    it('uses correct brand colors for lines', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-PEA Volta').getAttribute('data-stroke')).toBe('#00A651');
        expect(screen.getByTestId('line-EA Anywhere').getAttribute('data-stroke')).toBe('#FF6B00');
      });
    });

    it('passes correct data count to chart', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart').getAttribute('data-count')).toBe('3');
      });
    });

    it('renders chart axes and grid', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        expect(screen.getByTestId('y-axis')).toBeInTheDocument();
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      });
    });

    it('renders tooltip and legend', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('legend')).toBeInTheDocument();
      });
    });

    it('renders in a responsive container', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });
    });

    it('renders with single network', async () => {
      mockResponse({
        dailyPrices: [
          { date: '2026-03-01', Solo: 4.5 },
          { date: '2026-03-02', Solo: 5.0 },
        ],
        networks: [{ name: 'Solo', color: '#123456' }],
      });

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-Solo')).toBeInTheDocument();
        expect(screen.queryByTestId('line-Other')).not.toBeInTheDocument();
      });
    });

    it('renders with many networks', async () => {
      const networks = Array.from({ length: 5 }, (_, i) => ({
        name: `Net${i}`,
        color: `#${String(i).repeat(6)}`,
      }));
      const dailyPrices = [
        { date: '2026-03-01', Net0: 5, Net1: 6, Net2: 7, Net3: 8, Net4: 9 },
        { date: '2026-03-02', Net0: 5.5, Net1: 6.5, Net2: 7.5, Net3: 8.5, Net4: 9.5 },
      ];
      mockResponse({ dailyPrices, networks });

      render(<DailyPriceChart />);

      await waitFor(() => {
        for (let i = 0; i < 5; i++) {
          expect(screen.getByTestId(`line-Net${i}`)).toBeInTheDocument();
        }
      });
    });
  });

  describe('date range selector', () => {
    it('renders all range buttons', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('range30')).toBeInTheDocument();
        expect(screen.getByText('range90')).toBeInTheDocument();
        expect(screen.getByText('rangeAll')).toBeInTheDocument();
      });
    });

    it('defaults to 90 day range', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=90');
      });
    });

    it('fetches with range=30 when 30 day button clicked', async () => {
      const user = userEvent.setup();
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('range30')).toBeInTheDocument();
      });

      await user.click(screen.getByText('range30'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=30');
      });
    });

    it('fetches with range=all when all-time button clicked', async () => {
      const user = userEvent.setup();
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByText('rangeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('rangeAll'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=all');
      });
    });

    it('switching range triggers new fetch with updated URL', async () => {
      const user = userEvent.setup();
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      await user.click(screen.getByText('range30'));

      await waitFor(() => {
        const callsAfter = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
        expect(callsAfter).toBeGreaterThan(callsBefore);
        // The latest call should have range=30
        const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
        expect(lastCall?.[0]).toBe('/api/ev/stats/daily-prices?range=30');
      });
    });

    it('switching back to 90d re-fetches with correct URL', async () => {
      const user = userEvent.setup();
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Switch to 30d
      await user.click(screen.getByText('range30'));
      await waitFor(() => {
        const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
        expect(lastCall?.[0]).toBe('/api/ev/stats/daily-prices?range=30');
      });

      // Switch back to 90d
      await user.click(screen.getByText('range90'));
      await waitFor(() => {
        const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
        expect(lastCall?.[0]).toBe('/api/ev/stats/daily-prices?range=90');
      });
    });
  });

  describe('fetch behavior', () => {
    it('calls the correct API endpoint', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ev/stats/daily-prices?range=90');
      });
    });

    it('fetches on mount', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading then data', async () => {
      let resolveFetch: (value: unknown) => void;
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const { container } = render(<DailyPriceChart />);

      // Should be loading
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

      // Resolve fetch
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve(sampleData),
      });

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('range buttons are proper button elements', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(3); // 30d, 90d, all
      });
    });

    it('range buttons have type="button"', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toHaveAttribute('type', 'button');
        });
      });
    });
  });

  describe('active range styling', () => {
    it('highlights the active range button', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        const btn90 = screen.getByText('range90');
        expect(btn90.className).toContain('bg-background');
      });
    });

    it('non-active range buttons have muted style', async () => {
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        const btn30 = screen.getByText('range30');
        expect(btn30.className).toContain('text-muted-foreground');
      });
    });

    it('updates active style when range changes', async () => {
      const user = userEvent.setup();
      mockResponse(sampleData);

      render(<DailyPriceChart />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      await user.click(screen.getByText('range30'));

      await waitFor(() => {
        const btn30 = screen.getByText('range30');
        expect(btn30.className).toContain('bg-background');
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

global.fetch = vi.fn();
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

import { ReferralCodesTable } from './referral-codes-table';

const mockNetworks = [
  {
    id: 'net-a',
    name: 'Network A',
    slug: 'network-a',
    logo: null,
    brandColor: '#00A651',
    referralCode: 'REF-A',
    referralCaptionEn: 'Get 300 THB free',
    referralCaptionTh: 'รับ 300 บาทฟรี',
  },
  {
    id: 'net-b',
    name: 'Network B',
    slug: 'network-b',
    logo: '/logo-b.png',
    brandColor: '#FF6B00',
    referralCode: null,
    referralCaptionEn: null,
    referralCaptionTh: null,
  },
  {
    id: 'net-c',
    name: 'Network C',
    slug: 'network-c',
    logo: null,
    brandColor: '#333',
    referralCode: 'REF-C',
    referralCaptionEn: null,
    referralCaptionTh: 'โปรโมชันพิเศษ',
  },
];

function mockFetchNetworks() {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ networks: mockNetworks }),
  } as Response);
}

beforeEach(() => {
  vi.mocked(global.fetch).mockReset();
  vi.mocked(global.confirm).mockReturnValue(true);
});

describe('ReferralCodesTable', () => {
  it('shows loading state initially', () => {
    vi.mocked(global.fetch).mockReturnValue(new Promise(() => {}));
    render(<ReferralCodesTable />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('fail'));
    render(<ReferralCodesTable />);
    await waitFor(() => {
      expect(screen.getByText('failedToLoad')).toBeInTheDocument();
    });
  });

  it('shows only networks with referral codes', async () => {
    mockFetchNetworks();
    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('Network A')).toBeInTheDocument();
      expect(screen.getByText('Network C')).toBeInTheDocument();
    });
    // Network B has no referral code — should not appear
    expect(screen.queryByText('Network B')).not.toBeInTheDocument();
  });

  it('displays referral codes', async () => {
    mockFetchNetworks();
    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('REF-A')).toBeInTheDocument();
      expect(screen.getByText('REF-C')).toBeInTheDocument();
    });
  });

  it('displays captions', async () => {
    mockFetchNetworks();
    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('Get 300 THB free')).toBeInTheDocument();
      expect(screen.getByText('รับ 300 บาทฟรี')).toBeInTheDocument();
      expect(screen.getByText('โปรโมชันพิเศษ')).toBeInTheDocument();
    });
  });

  it('shows no referral codes message when none exist', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ networks: [{ ...mockNetworks[1] }] }),
    } as Response);

    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('noReferralCodes')).toBeInTheDocument();
    });
  });

  it('shows add button', async () => {
    mockFetchNetworks();
    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('add')).toBeInTheDocument();
    });
  });

  it('opens form when add is clicked', async () => {
    mockFetchNetworks();
    const user = userEvent.setup();
    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('add')).toBeInTheDocument();
    });

    await user.click(screen.getByText('add'));
    expect(screen.getByText('addReferralCode')).toBeInTheDocument();
  });

  it('opens form with data when edit is clicked', async () => {
    mockFetchNetworks();
    const user = userEvent.setup();
    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('REF-A')).toBeInTheDocument();
    });

    // Click first edit button
    const editButtons = screen.getAllByRole('button').filter(
      (btn) => btn.querySelector('.lucide-pencil') || btn.innerHTML.includes('pencil')
    );
    // Use a more reliable selector
    const allButtons = screen.getAllByRole('button');
    // Find the edit button (the one with Pencil icon, not Plus or Trash)
    const editBtn = allButtons[1]; // First network's edit button (after Add)
    await user.click(editBtn);

    expect(screen.getByText('editReferralCode')).toBeInTheDocument();
  });

  it('removes referral code with confirmation', async () => {
    mockFetchNetworks();
    const user = userEvent.setup();

    render(<ReferralCodesTable />);

    await waitFor(() => {
      expect(screen.getByText('REF-A')).toBeInTheDocument();
    });

    // Set up mocks for PATCH + refetch after initial load
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ network: {} }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ networks: mockNetworks.filter((n) => n.id !== 'net-a') }),
      } as Response);

    // Click delete button for first network (find by class)
    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.className.includes('text-destructive')
    );
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalledWith('confirmRemove');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/charging-networks/net-a',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          referralCode: null,
          referralCaptionEn: null,
          referralCaptionTh: null,
        }),
      })
    );
  });
});

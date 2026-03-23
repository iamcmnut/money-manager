import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

global.fetch = vi.fn();

import { ReferralCodeForm } from './referral-code-form';

const onSuccess = vi.fn();
const onCancel = vi.fn();

const mockNetworks = [
  { id: 'net-a', name: 'Network A', brandColor: '#00A651', referralCode: null },
  { id: 'net-b', name: 'Network B', brandColor: '#FF6B00', referralCode: 'EXISTING' },
  { id: 'net-c', name: 'Network C', brandColor: '#333', referralCode: null },
];

beforeEach(() => {
  vi.mocked(global.fetch).mockReset();
  onSuccess.mockReset();
  onCancel.mockReset();
});

describe('ReferralCodeForm', () => {
  describe('create mode', () => {
    it('renders the form with empty fields', () => {
      render(
        <ReferralCodeForm referralCode={null} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );
      expect(screen.getByText('addReferralCode')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('REF-ABC123')).toHaveValue('');
    });

    it('shows network dropdown with only networks without existing codes', () => {
      render(
        <ReferralCodeForm referralCode={null} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );
      // Network A and C don't have codes, Network B does
      const options = screen.getAllByRole('option');
      // 3 options: placeholder + Network A + Network C
      expect(options).toHaveLength(3);
      expect(screen.getByText('Network A')).toBeInTheDocument();
      expect(screen.getByText('Network C')).toBeInTheDocument();
      expect(screen.queryByText('Network B')).not.toBeInTheDocument();
    });

    it('renders caption EN and TH fields', () => {
      render(
        <ReferralCodeForm referralCode={null} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );
      expect(screen.getByText('captionEn')).toBeInTheDocument();
      expect(screen.getByText('captionTh')).toBeInTheDocument();
    });

    it('submits with correct payload', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ network: {} }),
      } as Response);

      const user = userEvent.setup();
      render(
        <ReferralCodeForm referralCode={null} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );

      await user.selectOptions(screen.getByRole('combobox'), 'net-a');
      await user.type(screen.getByPlaceholderText('REF-ABC123'), 'MY-CODE');
      await user.type(screen.getByPlaceholderText('captionEnPlaceholder'), 'Get 300 THB free');
      await user.type(screen.getByPlaceholderText('captionThPlaceholder'), 'รับ 300 บาทฟรี');

      await user.click(screen.getByText('save'));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/charging-networks/net-a',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            referralCode: 'MY-CODE',
            referralCaptionEn: 'Get 300 THB free',
            referralCaptionTh: 'รับ 300 บาทฟรี',
          }),
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it('sends null for empty captions', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ network: {} }),
      } as Response);

      const user = userEvent.setup();
      render(
        <ReferralCodeForm referralCode={null} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );

      await user.selectOptions(screen.getByRole('combobox'), 'net-a');
      await user.type(screen.getByPlaceholderText('REF-ABC123'), 'CODE');
      await user.click(screen.getByText('save'));

      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
      expect(body.referralCaptionEn).toBeNull();
      expect(body.referralCaptionTh).toBeNull();
    });
  });

  describe('edit mode', () => {
    const existingCode = {
      networkId: 'net-b',
      networkName: 'Network B',
      code: 'EXISTING',
      captionEn: 'English caption',
      captionTh: 'คำอธิบายไทย',
    };

    it('populates fields from existing data', () => {
      render(
        <ReferralCodeForm referralCode={existingCode} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );
      expect(screen.getByText('editReferralCode')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('REF-ABC123')).toHaveValue('EXISTING');
      expect(screen.getByDisplayValue('English caption')).toBeInTheDocument();
      expect(screen.getByDisplayValue('คำอธิบายไทย')).toBeInTheDocument();
    });

    it('disables network dropdown when editing', () => {
      render(
        <ReferralCodeForm referralCode={existingCode} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('shows all networks in dropdown when editing', () => {
      render(
        <ReferralCodeForm referralCode={existingCode} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );
      // All 3 networks + placeholder = 4 options
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
    });
  });

  describe('cancel', () => {
    it('calls onCancel', async () => {
      const user = userEvent.setup();
      render(
        <ReferralCodeForm referralCode={null} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );
      await user.click(screen.getByText('cancel'));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('shows error on failed save', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Network not found' }),
      } as Response);

      const user = userEvent.setup();
      render(
        <ReferralCodeForm referralCode={null} networks={mockNetworks} onSuccess={onSuccess} onCancel={onCancel} />
      );

      await user.selectOptions(screen.getByRole('combobox'), 'net-a');
      await user.type(screen.getByPlaceholderText('REF-ABC123'), 'CODE');
      await user.click(screen.getByText('save'));

      expect(await screen.findByText('Network not found')).toBeInTheDocument();
    });
  });
});

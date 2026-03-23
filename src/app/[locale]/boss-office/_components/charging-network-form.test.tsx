import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

global.fetch = vi.fn();

import { ChargingNetworkForm } from './charging-network-form';

beforeEach(() => {
  vi.mocked(global.fetch).mockReset();
});

const onSuccess = vi.fn();
const onCancel = vi.fn();

function renderForm(network: Parameters<typeof ChargingNetworkForm>[0]['network'] = null) {
  return render(
    <ChargingNetworkForm network={network} onSuccess={onSuccess} onCancel={onCancel} />
  );
}

describe('ChargingNetworkForm', () => {
  describe('create mode', () => {
    it('renders the form with empty fields', () => {
      renderForm();
      expect(screen.getByText('evNetworks.addNetwork')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('PTT EV Station PluZ')).toHaveValue('');
      expect(screen.getByPlaceholderText('REF-ABC123')).toHaveValue('');
    });

    it('renders the referral code input field', () => {
      renderForm();
      expect(screen.getByText('evNetworks.referralCode')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('REF-ABC123')).toBeInTheDocument();
    });

    it('submits with referral code', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ network: {} }),
      } as Response);

      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText('PTT EV Station PluZ'), 'Test Network');
      await user.type(screen.getByPlaceholderText('REF-ABC123'), 'MY-REFERRAL');

      await user.click(screen.getByText('evNetworks.save'));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/charging-networks',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"referralCode":"MY-REFERRAL"'),
        })
      );
    });

    it('submits with null referral code when empty', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ network: {} }),
      } as Response);

      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText('PTT EV Station PluZ'), 'Test Network');

      await user.click(screen.getByText('evNetworks.save'));

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.referralCode).toBeNull();
    });
  });

  describe('edit mode', () => {
    const existingNetwork = {
      id: 'test-net',
      name: 'Existing Network',
      slug: 'existing-network',
      logo: null,
      website: 'https://example.com',
      phone: '02-123-4567',
      brandColor: '#FF0000',
      referralCode: 'EXISTING-REF',
    };

    it('populates referral code from existing network', () => {
      renderForm(existingNetwork);
      expect(screen.getByPlaceholderText('REF-ABC123')).toHaveValue('EXISTING-REF');
    });

    it('renders edit title', () => {
      renderForm(existingNetwork);
      expect(screen.getByText('evNetworks.editNetwork')).toBeInTheDocument();
    });

    it('can update referral code', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ network: {} }),
      } as Response);

      const user = userEvent.setup();
      renderForm(existingNetwork);

      const input = screen.getByPlaceholderText('REF-ABC123');
      await user.clear(input);
      await user.type(input, 'UPDATED-REF');

      await user.click(screen.getByText('evNetworks.save'));

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/charging-networks/${existingNetwork.id}`,
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"referralCode":"UPDATED-REF"'),
        })
      );
    });

    it('can clear referral code', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ network: {} }),
      } as Response);

      const user = userEvent.setup();
      renderForm(existingNetwork);

      const input = screen.getByPlaceholderText('REF-ABC123');
      await user.clear(input);

      await user.click(screen.getByText('evNetworks.save'));

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      expect(body.referralCode).toBeNull();
    });
  });

  describe('cancel', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByText('evNetworks.cancel'));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('shows error message on failed save', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Slug already exists' }),
      } as Response);

      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText('PTT EV Station PluZ'), 'Test');
      await user.click(screen.getByText('evNetworks.save'));

      expect(await screen.findByText('Slug already exists')).toBeInTheDocument();
    });
  });
});

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Plus, Pencil, Trash2, ExternalLink, Phone, Tag, Download } from 'lucide-react';
import { ChargingNetworkForm } from './charging-network-form';
import { sanitizeUrl } from '@/lib/sanitize-url';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

interface NetworkData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  phone: string | null;
  brandColor: string | null;
  referralCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface NetworksResponse {
  networks?: NetworkData[];
  error?: string;
}

interface ErrorResponse {
  error?: string;
}

export function ChargingNetworksTable() {
  const t = useTranslations('admin');
  const [networks, setNetworks] = useState<NetworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingNetwork, setEditingNetwork] = useState<NetworkData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNetworks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/charging-networks');
      const data = (await response.json()) as NetworksResponse;

      if (response.ok && data.networks) {
        setNetworks(data.networks);
      } else {
        setError(data.error || t('evNetworks.failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch networks:', err);
      setError(t('evNetworks.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const deleteNetwork = async (id: string) => {
    if (!confirm(t('evNetworks.confirmDelete'))) return;

    setDeletingId(id);

    try {
      const response = await fetch(`/api/admin/charging-networks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNetworks((prev) => prev.filter((n) => n.id !== id));
      } else {
        const data = (await response.json()) as ErrorResponse;
        alert(data.error || t('evNetworks.failedToDelete'));
      }
    } catch (err) {
      console.error('Failed to delete network:', err);
      alert(t('evNetworks.failedToDelete'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingNetwork(null);
    fetchNetworks();
  };

  const exportNetworks = () => {
    const headers = ['Name', 'Slug', 'Website', 'Phone', 'Brand Color', 'Referral Code', 'Created At'];
    const rows = networks.map((n) => [
      n.name,
      n.slug,
      n.website || '',
      n.phone || '',
      n.brandColor || '',
      n.referralCode || '',
      n.createdAt || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ev-networks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('evNetworks.loading')}</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {networks.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={exportNetworks}
          >
            <Download className="mr-1 h-4 w-4" />
            {t('export')}
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => {
            setEditingNetwork(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('evNetworks.add')}
        </Button>
      </div>

      {showForm && (
        <ChargingNetworkForm
          network={editingNetwork}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingNetwork(null);
          }}
        />
      )}

      {networks.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('evNetworks.noNetworks')}</div>
      ) : (
        <div className="space-y-3">
          {networks
            .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
            .map((network) => (
            <div
              key={network.id}
              className="flex items-center justify-between rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                {network.logo ? (
                  <Image
                    src={network.logo}
                    alt={network.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm"
                    style={{ backgroundColor: network.brandColor || '#6B7280' }}
                  >
                    {network.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{network.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {network.website && sanitizeUrl(network.website) && (
                      <a
                        href={sanitizeUrl(network.website)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t('evNetworks.website')}
                      </a>
                    )}
                    {network.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {network.phone}
                      </span>
                    )}
                    {network.referralCode && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {network.referralCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingNetwork(network);
                    setShowForm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === network.id}
                  onClick={() => deleteNetwork(network.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(networks.length / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
            showingLabel={t('pagination.showing', {
              from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(currentPage * ITEMS_PER_PAGE, networks.length),
              total: networks.length,
            })}
          />
        </div>
      )}
    </div>
  );
}

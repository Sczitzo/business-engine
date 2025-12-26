'use client';

import { useState, useEffect } from 'react';
import type { ContentPack } from '@/lib/core/types';

interface ContentPackListProps {
  businessProfileId: string;
  selectedContentPack: ContentPack | null;
  onSelect: (contentPack: ContentPack) => void;
  refreshKey: number;
}

export default function ContentPackList({
  businessProfileId,
  selectedContentPack,
  onSelect,
  refreshKey,
}: ContentPackListProps) {
  const [contentPacks, setContentPacks] = useState<ContentPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadContentPacks();
  }, [businessProfileId, statusFilter, refreshKey]);

  async function loadContentPacks() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/content-packs', window.location.origin);
      url.searchParams.set('businessProfileId', businessProfileId);
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load content packs');
      }

      const data = await response.json();
      setContentPacks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load content packs');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#4caf50';
      case 'pending_approval':
        return '#ff9800';
      case 'rejected':
        return '#f44336';
      case 'draft':
      default:
        return '#9e9e9e';
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading content packs...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: '#d32f2f' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          Content Packs
        </h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '100%' }}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {contentPacks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            No content packs found
          </div>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {contentPacks.map((pack) => (
              <button
                key={pack.id}
                onClick={() => onSelect(pack)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  textAlign: 'left',
                  backgroundColor:
                    selectedContentPack?.id === pack.id ? '#e3f2fd' : '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    marginBottom: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {pack.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    marginBottom: '0.25rem',
                  }}
                >
                  {pack.content_type}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(pack.status),
                      color: '#fff',
                    }}
                  >
                    {pack.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


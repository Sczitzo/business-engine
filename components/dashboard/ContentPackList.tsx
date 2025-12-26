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
        return { bg: 'rgba(52, 199, 89, 0.15)', text: '#34c759', border: 'rgba(52, 199, 89, 0.3)' };
      case 'pending_approval':
        return { bg: 'rgba(255, 149, 0, 0.15)', text: '#ff9500', border: 'rgba(255, 149, 0, 0.3)' };
      case 'rejected':
        return { bg: 'rgba(255, 59, 48, 0.15)', text: '#ff3b30', border: 'rgba(255, 59, 48, 0.3)' };
      case 'draft':
      default:
        return { bg: 'rgba(142, 142, 147, 0.15)', text: '#8e8e93', border: 'rgba(142, 142, 147, 0.3)' };
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '3rem 2rem', 
        textAlign: 'center', 
        color: '#86868b',
        fontSize: '0.9375rem',
      }}>
        Loading content packs...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        color: '#ff3b30',
        fontSize: '0.9375rem',
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '1.5rem', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
      }}>
        <h3
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#86868b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Content Packs
        </h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ 
            width: '100%',
            padding: '0.625rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(142, 142, 147, 0.2)',
            backgroundColor: 'rgba(142, 142, 147, 0.12)',
            fontSize: '0.9375rem',
            color: '#1d1d1f',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2386868b' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
        {contentPacks.length === 0 ? (
          <div style={{ 
            padding: '3rem 2rem', 
            textAlign: 'center', 
            color: '#86868b',
            fontSize: '0.9375rem',
          }}>
            No content packs found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {contentPacks.map((pack) => {
              const statusStyle = getStatusColor(pack.status);
              return (
                <button
                  key={pack.id}
                  onClick={() => onSelect(pack)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    textAlign: 'left',
                    backgroundColor: selectedContentPack?.id === pack.id 
                      ? 'rgba(0, 122, 255, 0.1)' 
                      : 'transparent',
                    border: selectedContentPack?.id === pack.id
                      ? '1px solid rgba(0, 122, 255, 0.3)'
                      : '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedContentPack?.id !== pack.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(142, 142, 147, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedContentPack?.id !== pack.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: '0.375rem',
                      fontSize: '0.9375rem',
                      color: '#1d1d1f',
                      lineHeight: 1.4,
                    }}
                  >
                    {pack.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: '#86868b',
                      marginBottom: '0.5rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {pack.content_type}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '8px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    >
                      {pack.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


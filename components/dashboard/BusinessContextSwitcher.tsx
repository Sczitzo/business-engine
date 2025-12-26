'use client';

import { useState, useEffect } from 'react';
import type { BusinessProfile } from '@/lib/core/types';

interface BusinessContextSwitcherProps {
  selectedProfile: BusinessProfile | null;
  onProfileChange: (profile: BusinessProfile | null) => void;
}

export default function BusinessContextSwitcher({
  selectedProfile,
  onProfileChange,
}: BusinessContextSwitcherProps) {
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessProfiles();
  }, []);

  async function loadBusinessProfiles() {
    try {
      setLoading(true);
      setError(null);

      // First, try to seed demo data if nothing exists
      const seedResponse = await fetch('/api/seed', { method: 'POST' });
      if (seedResponse.ok) {
        console.log('✅ Demo data seeded');
      }

      // Then load business profiles using service role (bypassing auth)
      // We'll use a direct API call that doesn't require auth
      const response = await fetch('/api/business-profiles');
      
      if (response.ok) {
        const data = await response.json();
        setBusinessProfiles(data || []);
        
        // Auto-select first profile if none selected
        if (!selectedProfile && data && data.length > 0) {
          onProfileChange(data[0]);
        }
      } else {
        setBusinessProfiles([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load business profiles');
      setBusinessProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading business profiles...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: '#d32f2f' }}>
        Error: {error}
      </div>
    );
  }

  if (businessProfiles.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#666' }}>
        No business profiles found
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: '#333',
        }}
      >
        Business Context
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {businessProfiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onProfileChange(profile)}
            style={{
              padding: '0.75rem',
              textAlign: 'left',
              backgroundColor:
                selectedProfile?.id === profile.id ? '#e3f2fd' : 'transparent',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
              {profile.name}
            </div>
            {profile.market && (
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                {profile.market}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


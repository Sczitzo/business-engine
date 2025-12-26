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
      console.log('🌱 Seeding demo data...');
      const seedResponse = await fetch('/api/seed', { method: 'POST' });
      if (seedResponse.ok) {
        const seedData = await seedResponse.json();
        console.log('✅ Demo data seeded:', seedData);
      } else {
        const seedError = await seedResponse.json();
        console.warn('⚠️ Seed warning:', seedError);
      }

      // Then load business profiles using service role (bypassing auth)
      console.log('📦 Loading business profiles...');
      const response = await fetch('/api/business-profiles');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded business profiles:', data);
        setBusinessProfiles(data || []);
        
        // Auto-select first profile if none selected
        if (!selectedProfile && data && data.length > 0) {
          console.log('🎯 Auto-selecting first profile:', data[0]);
          onProfileChange(data[0]);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to load profiles:', errorData);
        setError(errorData.error || 'Failed to load business profiles');
        setBusinessProfiles([]);
      }
    } catch (err: any) {
      console.error('❌ Error loading business profiles:', err);
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
          fontSize: '0.8125rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: '#86868b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Business Profiles
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {businessProfiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onProfileChange(profile)}
            style={{
              padding: '1rem',
              textAlign: 'left',
              backgroundColor: selectedProfile?.id === profile.id 
                ? 'rgba(0, 122, 255, 0.1)' 
                : 'transparent',
              border: selectedProfile?.id === profile.id
                ? '1px solid rgba(0, 122, 255, 0.3)'
                : '1px solid transparent',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              if (selectedProfile?.id !== profile.id) {
                e.currentTarget.style.backgroundColor = 'rgba(142, 142, 147, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedProfile?.id !== profile.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{ 
              fontWeight: 600, 
              marginBottom: '0.25rem',
              color: '#1d1d1f',
              fontSize: '0.9375rem',
            }}>
              {profile.name}
            </div>
            {profile.market && (
              <div style={{ 
                fontSize: '0.8125rem', 
                color: '#86868b',
                fontWeight: 400,
              }}>
                {profile.market}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


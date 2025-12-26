'use client';

import { useState, useEffect } from 'react';
import BusinessContextSwitcher from './BusinessContextSwitcher';
import ContentPackList from './ContentPackList';
import ContentPackReview from './ContentPackReview';
import type { BusinessProfile, ContentPack } from '@/lib/core/types';

export default function Dashboard() {
  const [selectedBusinessProfile, setSelectedBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [selectedContentPack, setSelectedContentPack] =
    useState<ContentPack | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleContentPackSelect = (contentPack: ContentPack) => {
    setSelectedContentPack(contentPack);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setSelectedContentPack(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '1rem 2rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Business Engine</h1>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside
          style={{
            width: '300px',
            backgroundColor: '#fff',
            borderRight: '1px solid #e0e0e0',
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <BusinessContextSwitcher
            selectedProfile={selectedBusinessProfile}
            onProfileChange={setSelectedBusinessProfile}
          />
        </aside>

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div
            style={{
              width: '400px',
              borderRight: '1px solid #e0e0e0',
              backgroundColor: '#fafafa',
              overflowY: 'auto',
            }}
          >
            {selectedBusinessProfile ? (
              <ContentPackList
                businessProfileId={selectedBusinessProfile.id}
                selectedContentPack={selectedContentPack}
                onSelect={handleContentPackSelect}
                refreshKey={refreshKey}
              />
            ) : (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#666',
                }}
              >
                Select a business profile to view content packs
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
            {selectedContentPack ? (
              <ContentPackReview
                contentPack={selectedContentPack}
                onRefresh={handleRefresh}
              />
            ) : (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#666',
                }}
              >
                Select a content pack to review
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


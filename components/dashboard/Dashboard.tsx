'use client';

import { useState, useEffect } from 'react';
import BusinessContextSwitcher from './BusinessContextSwitcher';
import ContentPackList from './ContentPackList';
import ContentPackReview from './ContentPackReview';
import ContentPackGenerator from './ContentPackGenerator';
import BudgetManager from './BudgetManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import type { BusinessProfile, ContentPack } from '@/lib/core/types';

export default function Dashboard() {
  const [selectedBusinessProfile, setSelectedBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [selectedContentPack, setSelectedContentPack] =
    useState<ContentPack | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Business Engine</h1>
        {selectedBusinessProfile && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setShowAnalytics(!showAnalytics);
                setShowBudget(false);
                setShowGenerator(false);
              }}
              style={{
                backgroundColor: showAnalytics ? '#1976d2' : '#f5f5f5',
                color: showAnalytics ? '#fff' : '#333',
                padding: '0.5rem 1rem',
              }}
            >
              Analytics
            </button>
            <button
              onClick={() => {
                setShowBudget(!showBudget);
                setShowGenerator(false);
                setShowAnalytics(false);
              }}
              style={{
                backgroundColor: showBudget ? '#1976d2' : '#f5f5f5',
                color: showBudget ? '#fff' : '#333',
                padding: '0.5rem 1rem',
              }}
            >
              Budget
            </button>
            <button
              onClick={() => {
                setShowGenerator(!showGenerator);
                setShowBudget(false);
                setShowAnalytics(false);
              }}
              style={{
                backgroundColor: showGenerator ? '#1976d2' : '#4caf50',
                color: '#fff',
                padding: '0.5rem 1rem',
              }}
            >
              + Generate
            </button>
          </div>
        )}
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
            {showAnalytics && selectedBusinessProfile ? (
              <AnalyticsDashboard businessProfileId={selectedBusinessProfile.id} />
            ) : showGenerator && selectedBusinessProfile ? (
              <ContentPackGenerator
                businessProfileId={selectedBusinessProfile.id}
                onSuccess={() => {
                  setShowGenerator(false);
                  handleRefresh();
                }}
                onCancel={() => setShowGenerator(false)}
              />
            ) : showBudget && selectedBusinessProfile ? (
              <BudgetManager businessProfileId={selectedBusinessProfile.id} />
            ) : selectedContentPack ? (
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
                Select a content pack to review, or generate a new one
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


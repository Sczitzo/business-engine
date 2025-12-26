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
    setShowGenerator(false);
    setShowBudget(false);
    setShowAnalytics(false);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setSelectedContentPack(null);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#f5f5f7',
    }}>
      {/* Apple-style Header */}
      <header
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <h1 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: '#1d1d1f',
        }}>Business Engine</h1>
        {selectedBusinessProfile && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                setShowAnalytics(!showAnalytics);
                setShowBudget(false);
                setShowGenerator(false);
                setSelectedContentPack(null);
              }}
              style={{
                backgroundColor: showAnalytics ? '#007aff' : 'rgba(142, 142, 147, 0.12)',
                color: showAnalytics ? '#ffffff' : '#1d1d1f',
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (!showAnalytics) {
                  e.currentTarget.style.backgroundColor = 'rgba(142, 142, 147, 0.16)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showAnalytics) {
                  e.currentTarget.style.backgroundColor = 'rgba(142, 142, 147, 0.12)';
                }
              }}
            >
              Analytics
            </button>
            <button
              onClick={() => {
                setShowBudget(!showBudget);
                setShowGenerator(false);
                setShowAnalytics(false);
                setSelectedContentPack(null);
              }}
              style={{
                backgroundColor: showBudget ? '#007aff' : 'rgba(142, 142, 147, 0.12)',
                color: showBudget ? '#ffffff' : '#1d1d1f',
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (!showBudget) {
                  e.currentTarget.style.backgroundColor = 'rgba(142, 142, 147, 0.16)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showBudget) {
                  e.currentTarget.style.backgroundColor = 'rgba(142, 142, 147, 0.12)';
                }
              }}
            >
              Budget
            </button>
            <button
              onClick={() => {
                setShowGenerator(!showGenerator);
                setShowBudget(false);
                setShowAnalytics(false);
                setSelectedContentPack(null);
              }}
              style={{
                backgroundColor: showGenerator ? '#007aff' : '#007aff',
                color: '#ffffff',
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0051d5';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007aff';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              + Generate
            </button>
          </div>
        )}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Business Profiles */}
        <aside
          style={{
            width: '280px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRight: '1px solid rgba(0, 0, 0, 0.05)',
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          <BusinessContextSwitcher
            selectedProfile={selectedBusinessProfile}
            onProfileChange={setSelectedBusinessProfile}
          />
        </aside>

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: '1px' }}>
          {/* Middle Panel - Content Packs List */}
          <div
            style={{
              width: '380px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRight: '1px solid rgba(0, 0, 0, 0.05)',
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
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  color: '#86868b',
                  fontSize: '0.9375rem',
                }}
              >
                Select a business profile to view content packs
              </div>
            )}
          </div>

          {/* Right Panel - Content View */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            backgroundColor: '#f5f5f7',
          }}>
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
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: '#86868b',
                  fontSize: '0.9375rem',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                {selectedBusinessProfile ? (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1d1d1f', marginBottom: '0.5rem' }}>
                      Welcome to {selectedBusinessProfile.name}
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                      Select a content pack to review, or generate a new one
                    </div>
                    <button
                      onClick={() => {
                        setShowGenerator(true);
                        setShowBudget(false);
                        setShowAnalytics(false);
                      }}
                      style={{
                        backgroundColor: '#007aff',
                        color: '#ffffff',
                        padding: '0.875rem 2rem',
                        borderRadius: '12px',
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0051d5';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#007aff';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Generate New Content
                    </button>
                  </>
                ) : (
                  'Select a business profile to get started'
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


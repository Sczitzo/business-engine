'use client';

import { useState, useEffect } from 'react';
import type { BusinessProfileAnalytics } from '@/lib/core/analytics';

interface AnalyticsDashboardProps {
  businessProfileId: string;
}

export default function AnalyticsDashboard({ businessProfileId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<BusinessProfileAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [businessProfileId, dateRange]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      let startDate: string | undefined;
      const endDate = new Date().toISOString();

      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      }

      const response = await fetch(
        `/api/analytics?businessProfileId=${businessProfileId}${startDate ? `&startDate=${startDate}` : ''}&endDate=${endDate}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#d32f2f' }}>
        Error: {error}
      </div>
    );
  }

  if (!analytics) {
    return <div style={{ padding: '2rem' }}>No analytics data available</div>;
  }

  const { contentPackStats, budgetStats } = analytics;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analytics Dashboard</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          style={{ padding: '0.5rem' }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Content Pack Overview */}
        <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Content Packs</h3>
          <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {contentPackStats.total}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total content packs</div>
        </div>

        {/* Approval Rate */}
        <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Approval Rate</h3>
          <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {contentPackStats.approvalRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {contentPackStats.averageTimeToApproval
              ? `Avg: ${contentPackStats.averageTimeToApproval.toFixed(1)} hours`
              : 'No approvals yet'}
          </div>
        </div>

        {/* Budget Usage */}
        <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Budget Usage</h3>
          <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {budgetStats.currentMonth.percentage.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            ${budgetStats.currentMonth.spend.toFixed(2)} / ${budgetStats.currentMonth.cap.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Status Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {Object.entries(contentPackStats.byStatus).map(([status, count]) => (
            <div key={status} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                {count}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                {status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Type Breakdown */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Content Type Distribution</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(contentPackStats.byType).map(([type, count]) => {
            const percentage = (count / contentPackStats.total) * 100;
            return (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{type}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: '#1976d2',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Categories */}
      {budgetStats.topCategories.length > 0 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Top Spending Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {budgetStats.topCategories.map(({ category, amount }) => (
              <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{category}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {budgetStats.averageMonthlySpend !== undefined && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.875rem' }}>
          <strong>Average Monthly Spend:</strong> ${budgetStats.averageMonthlySpend.toFixed(2)} (last 6 months)
        </div>
      )}
    </div>
  );
}


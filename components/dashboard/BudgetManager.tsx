'use client';

import { useState, useEffect } from 'react';
import type { BudgetLedger } from '@/lib/core/types';

interface BudgetManagerProps {
  businessProfileId: string;
}

export default function BudgetManager({ businessProfileId }: BudgetManagerProps) {
  const [budgetLedger, setBudgetLedger] = useState<BudgetLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyCap, setMonthlyCap] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadBudget();
  }, [businessProfileId]);

  async function loadBudget() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/budget?businessProfileId=${businessProfileId}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load budget');
      }

      const data = await response.json();
      setBudgetLedger(data);
      if (data) {
        setMonthlyCap(data.monthly_cap.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load budget');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCap() {
    const cap = parseFloat(monthlyCap);
    if (isNaN(cap) || cap < 0) {
      setError('Monthly cap must be a valid positive number');
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      // Note: Budget cap updates should go through an approval workflow
      // For Phase 2, this is a simplified implementation
      const response = await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          monthlyCap: cap,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update budget cap');
      }

      await loadBudget();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading budget...</div>;
  }

  const currentSpend = budgetLedger ? Number(budgetLedger.actual_spend) : 0;
  const cap = budgetLedger ? Number(budgetLedger.monthly_cap) : 0;
  const remaining = cap > 0 ? cap - currentSpend : Infinity;
  const percentage = cap > 0 ? (currentSpend / cap) * 100 : 0;

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Budget Management
      </h2>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {budgetLedger ? (
          <>
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '1rem',
                borderRadius: '4px',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                  Current Month Spend
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  ${currentSpend.toFixed(2)}
                </div>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                  Monthly Cap
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  ${cap.toFixed(2)}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                  Remaining
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: remaining < 0 ? '#d32f2f' : remaining < cap * 0.1 ? '#ff9800' : '#4caf50',
                  }}
                >
                  ${remaining >= 0 ? remaining.toFixed(2) : 'Exceeded'}
                </div>
              </div>

              {cap > 0 && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                    Usage: {percentage.toFixed(1)}%
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
                        width: `${Math.min(100, percentage)}%`,
                        height: '100%',
                        backgroundColor:
                          percentage > 90 ? '#d32f2f' : percentage > 75 ? '#ff9800' : '#4caf50',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Update Monthly Cap
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={monthlyCap}
                  onChange={(e) => setMonthlyCap(e.target.value)}
                  min="0"
                  step="0.01"
                  style={{ flex: 1 }}
                  placeholder="0.00"
                />
                <button
                  onClick={handleUpdateCap}
                  disabled={updating}
                  style={{
                    backgroundColor: '#1976d2',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                  }}
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No budget configured for this business profile
          </div>
        )}
      </div>
    </div>
  );
}


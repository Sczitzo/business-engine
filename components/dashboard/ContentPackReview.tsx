'use client';

import { useState } from 'react';
import type { ContentPack } from '@/lib/core/types';

interface ContentPackReviewProps {
  contentPack: ContentPack;
  onRefresh: () => void;
}

export default function ContentPackReview({
  contentPack,
  onRefresh,
}: ContentPackReviewProps) {
  const [action, setAction] = useState<'submit' | 'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = contentPack.status === 'draft';
  const canApprove = contentPack.status === 'pending_approval';
  const canReject = contentPack.status === 'pending_approval';

  async function handleApprovalAction(actionType: 'submit' | 'approve' | 'reject') {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          contentPackId: contentPack.id,
          reviewNotes: reviewNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update approval status');
      }

      const successMessage =
        actionType === 'submit'
          ? 'Content pack submitted for approval'
          : actionType === 'approve'
          ? 'Content pack approved'
          : 'Content pack rejected';
      
      setSuccess(successMessage);
      setReviewNotes('');
      setAction(null);
      
      // Refresh after a short delay to show success message
      setTimeout(() => {
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
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

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {contentPack.title}
        </h2>
        {contentPack.description && (
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {contentPack.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              backgroundColor: getStatusColor(contentPack.status),
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {contentPack.status}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            {contentPack.content_type}
          </span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Content Data
        </h3>
        <pre
          style={{
            fontSize: '0.75rem',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify(contentPack.content_data, null, 2)}
        </pre>
      </div>

      {contentPack.metadata && Object.keys(contentPack.metadata).length > 0 && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Metadata
          </h3>
          <pre
            style={{
              fontSize: '0.75rem',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {JSON.stringify(contentPack.metadata, null, 2)}
          </pre>
        </div>
      )}

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

      {success && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {success}
        </div>
      )}

      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem' }}>
        {action ? (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              {action === 'submit'
                ? 'Submit for Approval'
                : action === 'approve'
                ? 'Approve Content Pack'
                : 'Reject Content Pack'}
            </h3>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Review notes (optional)"
              rows={4}
              style={{
                width: '100%',
                marginBottom: '1rem',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleApprovalAction(action)}
                disabled={loading}
                style={{
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                }}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setAction(null);
                  setReviewNotes('');
                  setError(null);
                }}
                disabled={loading}
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canSubmit && (
              <button
                onClick={() => setAction('submit')}
                style={{
                  backgroundColor: '#1976d2',
                  color: '#fff',
                }}
              >
                Submit for Approval
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => setAction('approve')}
                style={{
                  backgroundColor: '#4caf50',
                  color: '#fff',
                }}
              >
                Approve
              </button>
            )}
            {canReject && (
              <button
                onClick={() => setAction('reject')}
                style={{
                  backgroundColor: '#f44336',
                  color: '#fff',
                }}
              >
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


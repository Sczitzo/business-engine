'use client';

import { useState } from 'react';

interface ContentPackGeneratorProps {
  businessProfileId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ContentPackGenerator({
  businessProfileId,
  onSuccess,
  onCancel,
}: ContentPackGeneratorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'script' | 'hook' | 'post' | 'video' | 'other'>('post');
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic'>('openai');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!title || !prompt) {
      setError('Title and prompt are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/content-packs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          title,
          description: description || undefined,
          contentType,
          prompt,
          systemPrompt: systemPrompt || undefined,
          aiProvider,
          model: model || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate content pack');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Generate Content Pack with AI
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%' }}
            placeholder="Content pack title"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as any)}
            style={{ width: '100%' }}
          >
            <option value="script">Script</option>
            <option value="hook">Hook</option>
            <option value="post">Post</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            AI Provider
          </label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as any)}
            style={{ width: '100%' }}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Model (optional)
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ width: '100%' }}
            placeholder="Leave empty for default model"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            System Prompt (optional)
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Optional system instructions for the AI"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Prompt *
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Describe what content you want to generate..."
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={handleGenerate}
            disabled={loading || !title || !prompt}
            style={{
              flex: 1,
              backgroundColor: '#1976d2',
              color: '#fff',
              padding: '0.75rem',
            }}
          >
            {loading ? 'Generating...' : 'Generate Content Pack'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              backgroundColor: '#f5f5f5',
              color: '#333',
              padding: '0.75rem',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


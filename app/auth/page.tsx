'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="auth-subtitle">
            {isSignUp
              ? 'Sign up to get started with Business Engine'
              : 'Sign in to continue to your workspace'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 6v4M10 14h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
              className="auth-input"
              disabled={loading}
            />
            <label htmlFor="email" className="auth-label">
              Email
            </label>
          </div>

          <div className="input-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="auth-input"
              disabled={loading}
            />
            <label htmlFor="password" className="auth-label">
              Password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="auth-button-primary"
          >
            {loading ? (
              <span className="auth-loading">
                <span className="auth-spinner"></span>
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsSignUp(!isSignUp);
              setError(null);
              setEmail('');
              setPassword('');
            }}
            className="auth-button-secondary"
            disabled={loading}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}

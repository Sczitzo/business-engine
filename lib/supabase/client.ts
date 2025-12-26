// Supabase client for client-side operations (user context)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables at module level (top-level)
// This ensures Next.js can statically analyze and embed them in the client bundle
// IMPORTANT: These must be accessed directly, not through functions, for Next.js to embed them
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Runtime validation - this will catch if env vars weren't embedded
if (typeof window !== 'undefined') {
  // Client-side only
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are missing in client bundle!');
    console.error('URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('Key:', supabaseAnonKey ? 'SET' : 'MISSING');
    console.error('This usually means the variables were not available during the Vercel build.');
    console.error('Please check Vercel project settings and trigger a fresh deployment.');
  }
}

// Create client directly at module level - Next.js will replace process.env.NEXT_PUBLIC_* 
// with actual values during build if they're available
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);


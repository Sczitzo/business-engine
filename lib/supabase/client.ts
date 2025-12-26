// Supabase client for client-side operations (user context)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side: use environment variables directly (Next.js handles this)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

function initializeSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}\n` +
      'Please ensure these are set in your Vercel project settings or .env file.'
    );
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
  }

  // Validate anon key format (should be a JWT token starting with eyJ)
  if (!supabaseAnonKey.startsWith('eyJ') && !supabaseAnonKey.startsWith('sb_')) {
    console.warn(
      'Warning: Supabase anon key format may be incorrect. ' +
      'Standard anon keys are JWT tokens starting with "eyJ...". ' +
      'Please verify your key in Supabase Dashboard → Settings → API.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

// Initialize and export the client
export const supabase = initializeSupabaseClient();


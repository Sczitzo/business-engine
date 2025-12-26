// Supabase client for client-side operations (user context)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables at module level (top-level)
// This ensures Next.js can statically analyze and embed them in the client bundle
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    const errorMessage = `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
      'Please ensure these are set in your Vercel project settings and redeploy.';
    
    console.error(errorMessage);
    console.error('Debug info:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
    });
    
    throw new Error(errorMessage);
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

  // Double-check URL is valid before creating client
  if (!supabaseUrl || supabaseUrl.trim() === '') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'This variable must be available at build time. ' +
      'Please check your Vercel environment variables and redeploy.'
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'This variable must be available at build time. ' +
      'Please check your Vercel environment variables and redeploy.'
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

// Export getter function that initializes on first access
// This ensures env vars are checked when actually used, not at module load
function createSupabaseProxy(): SupabaseClient {
  return getSupabaseClient();
}

// Create a proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as SupabaseClient;


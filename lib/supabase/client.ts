// Supabase client for client-side operations (user context)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables at module level (top-level)
// This ensures Next.js can statically analyze and embed them in the client bundle
// IMPORTANT: These must be accessed directly, not through functions, for Next.js to embed them
const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Trim whitespace and validate
const supabaseUrl = supabaseUrlRaw?.trim() || '';
const supabaseAnonKey = supabaseAnonKeyRaw?.trim() || '';

// Validate that we have valid, non-empty strings
const isValidUrl = supabaseUrl.length > 0 && supabaseUrl.startsWith('http');
const isValidKey = supabaseAnonKey.length > 0;

// Runtime validation - this will catch if env vars weren't embedded
if (typeof window !== 'undefined') {
  // Client-side only
  if (!isValidUrl || !isValidKey) {
    console.error('❌ Supabase environment variables are missing or invalid in client bundle!');
    console.error('URL valid:', isValidUrl, 'Value:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING');
    console.error('Key valid:', isValidKey, 'Value:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
    console.error('This usually means the variables were not available during the Vercel build.');
    console.error('Please check Vercel project settings and trigger a fresh deployment.');
  }
}

// Validate URL format before creating client
if (isValidUrl) {
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    throw new Error(`Invalid Supabase URL format. Please check NEXT_PUBLIC_SUPABASE_URL in Vercel settings.`);
  }
}

// Create client directly at module level - Next.js will replace process.env.NEXT_PUBLIC_* 
// with actual values during build if they're available
// IMPORTANT: Only create with valid values - empty strings will cause "Invalid value" fetch errors
if (!isValidUrl || !isValidKey) {
  console.error('Cannot create Supabase client: invalid environment variables');
  throw new Error(
    `Supabase client cannot be initialized: ${!isValidUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : ''}${!isValidUrl && !isValidKey ? ', ' : ''}${!isValidKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''} is missing or invalid. ` +
    'Please check your Vercel environment variables and redeploy.'
  );
}

// Log the actual values being used (for debugging)
if (typeof window !== 'undefined') {
  console.log('🔧 Creating Supabase client with:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 40)}...` : 'MISSING',
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    urlStartsWithHttp: supabaseUrl?.startsWith('http'),
  });
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-client-info': 'business-engine@0.1.0',
      },
    },
  }
);



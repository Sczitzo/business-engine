// Supabase client for client-side operations (user context)

import { createClient } from '@supabase/supabase-js';

// Client-side: use environment variables directly (Next.js handles this)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  // Don't throw in client-side - let it fail gracefully
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


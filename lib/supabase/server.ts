// Supabase client for server-side operations (service role for elevated privileges)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase service role environment variables');
}

/**
 * Get Supabase client with service role (elevated privileges)
 * Use only for operations that require bypassing RLS (e.g., budget transactions)
 */
export function getSupabaseServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get Supabase client for authenticated user operations
 * Use for regular operations that respect RLS policies
 */
export async function getSupabaseUserClient() {
  const { createClient: createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    }
  );
}


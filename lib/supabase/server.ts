// Supabase client for server-side operations (service role for elevated privileges)

import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/utils/env';

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
// Trim any whitespace/newlines from service key (common issue with env vars)
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY').trim().replace(/\n/g, '');

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
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');
  const { getEnv } = await import('@/lib/utils/env');

  const cookieStore = cookies();

  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options || {});
          });
        },
      },
    }
  );
}


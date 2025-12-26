// API route middleware utilities

import { NextRequest } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import { AuthenticationError, AuthorizationError } from '@/lib/utils/errors';

/**
 * Require authentication for API route
 */
export async function requireAuth(request: NextRequest) {
  const supabase = await getSupabaseUserClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError('Authentication required');
  }

  return { user, supabase };
}

/**
 * Require organization membership
 */
export async function requireOrgMembership(
  supabase: any,
  userId: string,
  organizationId: string
) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    throw new AuthorizationError('User is not a member of this organization');
  }

  return data;
}

/**
 * Require admin role
 */
export async function requireAdmin(
  supabase: any,
  userId: string,
  organizationId: string
) {
  const membership = await requireOrgMembership(supabase, userId, organizationId);

  if (membership.role !== 'admin' && membership.role !== 'owner') {
    throw new AuthorizationError('Admin access required');
  }

  return membership;
}


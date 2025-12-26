// Content pack orchestration and management

import type { ContentPack, ContentType } from './types';
import { enforceApprovalGate } from './approval';
import { enforceBudgetCheck } from './budget';

/**
 * Create a new content pack
 */
export async function createContentPack(
  supabase: any,
  businessProfileId: string,
  userId: string,
  title: string,
  contentType: ContentType,
  contentData: Record<string, unknown>,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<ContentPack> {
  const { data, error } = await supabase
    .from('content_packs')
    .insert({
      business_profile_id: businessProfileId,
      created_by: userId,
      title,
      description,
      content_type: contentType,
      content_data: contentData,
      metadata: metadata || {},
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create content pack: ${error.message}`);
  }

  return data;
}

/**
 * Get content pack by ID
 */
export async function getContentPack(
  supabase: any,
  contentPackId: string
): Promise<ContentPack | null> {
  const { data, error } = await supabase
    .from('content_packs')
    .select('*')
    .eq('id', contentPackId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get content pack: ${error.message}`);
  }

  return data || null;
}

/**
 * Get all content packs for a business profile
 */
export async function getContentPacksForBusinessProfile(
  supabase: any,
  businessProfileId: string,
  status?: string
): Promise<ContentPack[]> {
  let query = supabase
    .from('content_packs')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get content packs: ${error.message}`);
  }

  return data || [];
}

/**
 * Update content pack (only allowed for draft status)
 */
export async function updateContentPack(
  supabase: any,
  contentPackId: string,
  updates: {
    title?: string;
    description?: string;
    content_data?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
): Promise<ContentPack> {
  // Check current status - only allow updates to draft packs
  const current = await getContentPack(supabase, contentPackId);

  if (!current) {
    throw new Error('Content pack not found');
  }

  if (current.status !== 'draft') {
    throw new Error(
      `Cannot update content pack with status ${current.status}. Only draft packs can be updated.`
    );
  }

  const { data, error } = await supabase
    .from('content_packs')
    .update(updates)
    .eq('id', contentPackId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update content pack: ${error.message}`);
  }

  return data;
}

/**
 * Prepare content pack for export
 * Enforces approval gate and budget check before export operations
 */
export async function prepareContentPackForExport(
  supabase: any,
  contentPackId: string,
  businessProfileId: string,
  exportCost: number = 0
): Promise<ContentPack> {
  // Enforce approval gate
  await enforceApprovalGate(supabase, contentPackId, 'content pack export');

  // Enforce budget check if export has a cost
  if (exportCost > 0) {
    await enforceBudgetCheck(
      supabase,
      businessProfileId,
      exportCost,
      'content pack export'
    );
  }

  // Get and return the approved content pack
  const contentPack = await getContentPack(supabase, contentPackId);

  if (!contentPack) {
    throw new Error('Content pack not found');
  }

  return contentPack;
}

/**
 * Delete content pack (only allowed for draft status)
 */
export async function deleteContentPack(
  supabase: any,
  contentPackId: string
): Promise<void> {
  // Check current status - only allow deletion of draft packs
  const current = await getContentPack(supabase, contentPackId);

  if (!current) {
    throw new Error('Content pack not found');
  }

  if (current.status !== 'draft') {
    throw new Error(
      `Cannot delete content pack with status ${current.status}. Only draft packs can be deleted.`
    );
  }

  const { error } = await supabase.from('content_packs').delete().eq('id', contentPackId);

  if (error) {
    throw new Error(`Failed to delete content pack: ${error.message}`);
  }
}


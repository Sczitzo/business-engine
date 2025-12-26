// Google Docs export adapter

import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { prepareContentPackForExport } from '@/lib/core/content-pack';
import { recordBudgetTransaction } from '@/lib/core/budget';
import { getCurrentMonthBudget } from '@/lib/core/budget';
import type { ContentPack } from '@/lib/core/types';

/**
 * Export content pack to Google Docs
 * Requires approved content pack and budget check
 */
export async function exportToGoogleDocs(
  contentPackId: string,
  businessProfileId: string,
  userId: string,
  documentTitle?: string
): Promise<{ documentId: string; documentUrl: string }> {
  const supabase = getSupabaseServiceClient();
  const { getSupabaseUserClient } = await import('@/lib/supabase/server');
  const userSupabase = await getSupabaseUserClient();

  // Prepare content pack (enforces approval and budget gates)
  const exportCost = 0; // Google Docs API is free, but could be configured
  const contentPack = await prepareContentPackForExport(
    userSupabase,
    contentPackId,
    businessProfileId,
    exportCost
  );

  // Get budget ledger for transaction recording
  const budgetLedger = await getCurrentMonthBudget(supabase, businessProfileId);

  // Export to Google Docs
  // Note: This is a placeholder implementation
  // In production, you would integrate with Google Docs API
  const documentId = await createGoogleDoc(contentPack, documentTitle);

  // Record budget transaction if export has cost and ledger exists
  if (exportCost > 0 && budgetLedger) {
    await recordBudgetTransaction(
      supabase,
      budgetLedger.id,
      exportCost,
      `Google Docs export: ${contentPack.title}`,
      userId,
      'export',
      'google_docs',
      { documentId, contentPackId }
    );
  }

  const documentUrl = `https://docs.google.com/document/d/${documentId}`;

  return {
    documentId,
    documentUrl,
  };
}

/**
 * Create Google Doc from content pack
 * Placeholder implementation - replace with actual Google Docs API integration
 */
async function createGoogleDoc(
  contentPack: ContentPack,
  documentTitle?: string
): Promise<string> {
  // Placeholder: In production, use Google Docs API
  // const docs = google.docs({ version: 'v1', auth: oauth2Client });
  // const response = await docs.documents.create({
  //   requestBody: {
  //     title: documentTitle || contentPack.title,
  //   },
  // });
  // return response.data.documentId!;

  // For now, return a mock document ID
  // In Phase 1, this demonstrates the adapter pattern
  console.log('Google Docs export:', {
    title: documentTitle || contentPack.title,
    contentPackId: contentPack.id,
    contentType: contentPack.content_type,
  });

  // Mock document ID
  return `mock-doc-${Date.now()}`;
}


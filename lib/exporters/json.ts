// JSON export adapter

import { prepareContentPackForExport } from '@/lib/core/content-pack';

/**
 * Export content pack to JSON
 * Requires approved content pack
 */
export async function exportToJSON(
  contentPackId: string,
  businessProfileId: string,
  userId: string
): Promise<{ content: string; filename: string }> {
  const { getSupabaseUserClient } = await import('@/lib/supabase/server');
  const userSupabase = await getSupabaseUserClient();

  // Prepare content pack (enforces approval gate, no budget check for JSON)
  const contentPack = await prepareContentPackForExport(
    userSupabase,
    contentPackId,
    businessProfileId,
    0
  );

  // Export as JSON
  const jsonContent = JSON.stringify(
    {
      id: contentPack.id,
      title: contentPack.title,
      description: contentPack.description,
      contentType: contentPack.content_type,
      contentData: contentPack.content_data,
      metadata: contentPack.metadata,
      status: contentPack.status,
      approvedAt: contentPack.approved_at,
      createdAt: contentPack.created_at,
    },
    null,
    2
  );

  return {
    content: jsonContent,
    filename: `${contentPack.title.replace(/[^a-z0-9]/gi, '_')}.json`,
  };
}


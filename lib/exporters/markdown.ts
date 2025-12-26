// Markdown export adapter

import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { prepareContentPackForExport } from '@/lib/core/content-pack';
import type { ContentPack } from '@/lib/core/types';

/**
 * Export content pack to Markdown
 * Requires approved content pack
 */
export async function exportToMarkdown(
  contentPackId: string,
  businessProfileId: string,
  userId: string
): Promise<{ content: string; filename: string }> {
  const { getSupabaseUserClient } = await import('@/lib/supabase/server');
  const userSupabase = await getSupabaseUserClient();

  // Prepare content pack (enforces approval gate, no budget check for markdown)
  const contentPack = await prepareContentPackForExport(
    userSupabase,
    contentPackId,
    businessProfileId,
    0
  );

  // Generate markdown content
  const markdown = generateMarkdownContent(contentPack);

  return {
    content: markdown,
    filename: `${contentPack.title.replace(/[^a-z0-9]/gi, '_')}.md`,
  };
}

/**
 * Generate markdown content from content pack
 */
function generateMarkdownContent(contentPack: ContentPack): string {
  let markdown = `# ${contentPack.title}\n\n`;

  if (contentPack.description) {
    markdown += `${contentPack.description}\n\n`;
  }

  markdown += `**Type:** ${contentPack.content_type}\n`;
  markdown += `**Status:** ${contentPack.status}\n`;
  if (contentPack.approved_at) {
    markdown += `**Approved:** ${new Date(contentPack.approved_at).toLocaleDateString()}\n`;
  }
  markdown += `\n---\n\n`;

  // Add content data
  if (contentPack.content_data.content) {
    markdown += `${contentPack.content_data.content}\n\n`;
  } else {
    markdown += '```json\n';
    markdown += JSON.stringify(contentPack.content_data, null, 2);
    markdown += '\n```\n';
  }

  // Add metadata if present
  if (contentPack.metadata && Object.keys(contentPack.metadata).length > 0) {
    markdown += `\n---\n\n## Metadata\n\n`;
    markdown += '```json\n';
    markdown += JSON.stringify(contentPack.metadata, null, 2);
    markdown += '\n```\n';
  }

  return markdown;
}


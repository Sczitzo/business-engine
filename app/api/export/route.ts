// API route for multiple export formats

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import { exportToGoogleDocs } from '@/lib/exporters/google-docs';
import { exportToPDF } from '@/lib/exporters/pdf';
import { exportToMarkdown } from '@/lib/exporters/markdown';
import { exportToJSON } from '@/lib/exporters/json';

// POST /api/export
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format, contentPackId, businessProfileId, ...formatSpecificOptions } = body;

    if (!format || !contentPackId || !businessProfileId) {
      return NextResponse.json(
        { error: 'Missing required fields: format, contentPackId, businessProfileId' },
        { status: 400 }
      );
    }

    let result;

    switch (format) {
      case 'google-docs':
        result = await exportToGoogleDocs(
          contentPackId,
          businessProfileId,
          user.id,
          formatSpecificOptions.documentTitle
        );
        break;

      case 'pdf':
        result = await exportToPDF(
          contentPackId,
          businessProfileId,
          user.id,
          formatSpecificOptions.filename
        );
        break;

      case 'markdown':
        result = await exportToMarkdown(contentPackId, businessProfileId, user.id);
        break;

      case 'json':
        result = await exportToJSON(contentPackId, businessProfileId, user.id);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported export format: ${format}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


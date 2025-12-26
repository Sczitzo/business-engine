// API route for Google Docs export

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import { exportToGoogleDocs } from '@/lib/exporters/google-docs';

// POST /api/export/google-docs
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentPackId, businessProfileId, documentTitle } = body;

    if (!contentPackId || !businessProfileId) {
      return NextResponse.json(
        { error: 'Missing required fields: contentPackId, businessProfileId' },
        { status: 400 }
      );
    }

    const result = await exportToGoogleDocs(
      contentPackId,
      businessProfileId,
      user.id,
      documentTitle
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


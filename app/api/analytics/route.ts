// API route for analytics

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import { getBusinessProfileAnalytics } from '@/lib/core/analytics';

// GET /api/analytics?businessProfileId=xxx&startDate=xxx&endDate=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const businessProfileId = searchParams.get('businessProfileId');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    if (!businessProfileId) {
      return NextResponse.json(
        { error: 'businessProfileId is required' },
        { status: 400 }
      );
    }

    const analytics = await getBusinessProfileAnalytics(
      supabase,
      businessProfileId,
      startDate,
      endDate
    );

    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


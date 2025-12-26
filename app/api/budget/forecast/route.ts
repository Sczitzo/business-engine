// API route for budget forecasting

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import { calculateBudgetForecast, getSpendingTrends } from '@/lib/core/budget-forecasting';

// GET /api/budget/forecast?businessProfileId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const businessProfileId = searchParams.get('businessProfileId');
    const trends = searchParams.get('trends') === 'true';

    if (!businessProfileId) {
      return NextResponse.json(
        { error: 'businessProfileId is required' },
        { status: 400 }
      );
    }

    if (trends) {
      // Get spending trends
      const trendsData = await getSpendingTrends(supabase, businessProfileId, 6);
      return NextResponse.json(trendsData);
    }

    // Get forecast
    const forecast = await calculateBudgetForecast(supabase, businessProfileId);

    if (!forecast) {
      return NextResponse.json({ error: 'No budget configured' }, { status: 404 });
    }

    return NextResponse.json(forecast);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


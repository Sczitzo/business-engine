// API route for budget operations

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import {
  getCurrentMonthBudget,
  checkBudgetAvailability,
  getBudgetLedgerForMonth,
} from '@/lib/core/budget';

// GET /api/budget?businessProfileId=xxx&year=2024&month=0
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const businessProfileId = searchParams.get('businessProfileId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const checkCost = searchParams.get('checkCost');

    if (!businessProfileId) {
      return NextResponse.json(
        { error: 'businessProfileId is required' },
        { status: 400 }
      );
    }

    // Check budget availability for an operation
    if (checkCost !== null) {
      const cost = parseFloat(checkCost);
      if (isNaN(cost) || cost < 0) {
        return NextResponse.json(
          { error: 'checkCost must be a valid positive number' },
          { status: 400 }
        );
      }

      const availability = await checkBudgetAvailability(
        supabase,
        businessProfileId,
        cost
      );

      return NextResponse.json(availability);
    }

    // Get budget ledger for specific month
    if (year !== null && month !== null) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
        return NextResponse.json(
          { error: 'year and month must be valid (month 0-11)' },
          { status: 400 }
        );
      }

      const ledger = await getBudgetLedgerForMonth(
        supabase,
        businessProfileId,
        yearNum,
        monthNum
      );

      return NextResponse.json(ledger);
    }

    // Get current month budget (default)
    const ledger = await getCurrentMonthBudget(supabase, businessProfileId);

    return NextResponse.json(ledger);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


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

// PATCH /api/budget
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessProfileId, monthlyCap } = body;

    if (!businessProfileId || monthlyCap === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: businessProfileId, monthlyCap' },
        { status: 400 }
      );
    }

    if (monthlyCap < 0) {
      return NextResponse.json(
        { error: 'Monthly cap must be greater than or equal to 0' },
        { status: 400 }
      );
    }

    // Get current month
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthKey = monthStart.toISOString().split('T')[0].substring(0, 7) + '-01';

    // Get or create budget ledger
    let ledger = await getCurrentMonthBudget(supabase, businessProfileId);

    if (ledger) {
      // Update existing ledger
      const { data, error } = await supabase
        .from('budget_ledger')
        .update({ monthly_cap: monthlyCap })
        .eq('id', ledger.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update budget ledger: ${error.message}`);
      }

      return NextResponse.json(data);
    } else {
      // Create new ledger
      // Get organization_id from business profile
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('organization_id')
        .eq('id', businessProfileId)
        .single();

      if (profileError) {
        throw new Error(`Failed to get business profile: ${profileError.message}`);
      }

      const { data, error } = await supabase
        .from('budget_ledger')
        .insert({
          business_profile_id: businessProfileId,
          organization_id: profile.organization_id,
          month: monthKey,
          monthly_cap: monthlyCap,
          actual_spend: 0,
          currency: 'USD',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create budget ledger: ${error.message}`);
      }

      return NextResponse.json(data);
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


// Budget forecasting and projections

import type { BudgetLedger, BudgetTransaction } from './types';

export interface BudgetForecast {
  currentMonth: {
    spend: number;
    cap: number;
    projectedSpend: number; // Projected end-of-month spend
    remaining: number;
    daysRemaining: number;
  };
  nextMonth: {
    projectedSpend: number;
    recommendedCap: number;
  };
  trends: {
    averageDailySpend: number;
    spendVelocity: number; // Spend per day
    projectedOverspend: boolean;
  };
}

/**
 * Calculate budget forecast based on historical data
 */
export async function calculateBudgetForecast(
  supabase: any,
  businessProfileId: string
): Promise<BudgetForecast | null> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = monthStart.toISOString().split('T')[0].substring(0, 7) + '-01';

  // Get current month budget
  const { data: currentLedger, error: ledgerError } = await supabase
    .from('budget_ledger')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .eq('month', monthKey)
    .single();

  if (ledgerError && ledgerError.code === 'PGRST116') {
    return null; // No budget configured
  }

  if (ledgerError) {
    throw new Error(`Failed to get budget ledger: ${ledgerError.message}`);
  }

  const currentSpend = Number(currentLedger.actual_spend) || 0;
  const monthlyCap = Number(currentLedger.monthly_cap) || 0;

  // Get transactions for current month to calculate daily spend
  const { data: transactions, error: transError } = await supabase
    .from('budget_transactions')
    .select('amount, created_at')
    .eq('budget_ledger_id', currentLedger.id)
    .order('created_at', { ascending: true });

  if (transError && transError.code !== 'PGRST116') {
    throw new Error(`Failed to get transactions: ${transError.message}`);
  }

  // Calculate daily spend rate
  const today = new Date();
  const daysElapsed = Math.max(1, Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
  const averageDailySpend = currentSpend / daysElapsed;

  // Calculate days remaining in month
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const daysInMonth = Math.floor((nextMonthStart.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = daysInMonth - daysElapsed;

  // Project end-of-month spend
  const projectedSpend = currentSpend + (averageDailySpend * daysRemaining);
  const remaining = monthlyCap - projectedSpend;
  const projectedOverspend = projectedSpend > monthlyCap;

  // Calculate next month projection based on historical average
  const nextMonthProjected = await calculateNextMonthProjection(supabase, businessProfileId);

  return {
    currentMonth: {
      spend: currentSpend,
      cap: monthlyCap,
      projectedSpend,
      remaining: Math.max(0, remaining),
      daysRemaining,
    },
    nextMonth: {
      projectedSpend: nextMonthProjected.average,
      recommendedCap: nextMonthProjected.recommended,
    },
    trends: {
      averageDailySpend,
      spendVelocity: averageDailySpend,
      projectedOverspend,
    },
  };
}

/**
 * Calculate next month projection based on historical data
 */
async function calculateNextMonthProjection(
  supabase: any,
  businessProfileId: string
): Promise<{ average: number; recommended: number }> {
  const now = new Date();
  const monthKeys: string[] = [];

  // Get last 6 months
  for (let i = 1; i <= 6; i++) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthKeys.push(date.toISOString().split('T')[0].substring(0, 7) + '-01');
  }

  const { data: ledgers, error } = await supabase
    .from('budget_ledger')
    .select('actual_spend')
    .eq('business_profile_id', businessProfileId)
    .in('month', monthKeys);

  if (error || !ledgers || ledgers.length === 0) {
    return { average: 0, recommended: 0 };
  }

  const totalSpend = ledgers.reduce(
    (sum: number, ledger: any) => sum + (Number(ledger.actual_spend) || 0),
    0
  );
  const average = totalSpend / ledgers.length;

  // Recommended cap is 120% of average (20% buffer)
  const recommended = average * 1.2;

  return { average, recommended };
}

/**
 * Get spending trends over time
 */
export async function getSpendingTrends(
  supabase: any,
  businessProfileId: string,
  months: number = 6
): Promise<Array<{ month: string; spend: number; cap: number }>> {
  const now = new Date();
  const monthKeys: string[] = [];

  for (let i = 0; i < months; i++) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthKeys.push(date.toISOString().split('T')[0].substring(0, 7) + '-01');
  }

  const { data: ledgers, error } = await supabase
    .from('budget_ledger')
    .select('month, actual_spend, monthly_cap')
    .eq('business_profile_id', businessProfileId)
    .in('month', monthKeys)
    .order('month', { ascending: false });

  if (error) {
    throw new Error(`Failed to get spending trends: ${error.message}`);
  }

  return (ledgers || []).map((ledger: any) => ({
    month: ledger.month,
    spend: Number(ledger.actual_spend) || 0,
    cap: Number(ledger.monthly_cap) || 0,
  }));
}


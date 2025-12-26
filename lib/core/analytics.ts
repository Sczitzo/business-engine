// Analytics and reporting functions

import type { ContentPack, BudgetLedger } from './types';

export interface ContentPackStats {
  total: number;
  byStatus: {
    draft: number;
    pending_approval: number;
    approved: number;
    rejected: number;
  };
  byType: Record<string, number>;
  approvalRate: number;
  averageTimeToApproval?: number; // in hours
}

export interface BudgetStats {
  currentMonth: {
    spend: number;
    cap: number;
    remaining: number;
    percentage: number;
  };
  averageMonthlySpend?: number;
  topCategories: Array<{ category: string; amount: number }>;
}

export interface BusinessProfileAnalytics {
  contentPackStats: ContentPackStats;
  budgetStats: BudgetStats;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Get content pack statistics for a business profile
 */
export async function getContentPackStats(
  supabase: any,
  businessProfileId: string,
  startDate?: string,
  endDate?: string
): Promise<ContentPackStats> {
  let query = supabase
    .from('content_packs')
    .select('status, content_type, created_at, approved_at')
    .eq('business_profile_id', businessProfileId);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: packs, error } = await query;

  if (error) {
    throw new Error(`Failed to get content pack stats: ${error.message}`);
  }

  const stats: ContentPackStats = {
    total: packs.length,
    byStatus: {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
    },
    byType: {},
    approvalRate: 0,
  };

  let approvedCount = 0;
  let totalApprovalTime = 0;
  let approvalCount = 0;

  for (const pack of packs) {
    // Count by status
    stats.byStatus[pack.status as keyof typeof stats.byStatus]++;

    // Count by type
    stats.byType[pack.content_type] = (stats.byType[pack.content_type] || 0) + 1;

    // Calculate approval rate and time
    if (pack.status === 'approved' && pack.approved_at) {
      approvedCount++;
      if (pack.created_at) {
        const created = new Date(pack.created_at);
        const approved = new Date(pack.approved_at);
        const hours = (approved.getTime() - created.getTime()) / (1000 * 60 * 60);
        totalApprovalTime += hours;
        approvalCount++;
      }
    }
  }

  // Calculate approval rate (approved / (approved + rejected))
  const reviewedCount = stats.byStatus.approved + stats.byStatus.rejected;
  stats.approvalRate = reviewedCount > 0 ? (approvedCount / reviewedCount) * 100 : 0;

  // Calculate average time to approval
  if (approvalCount > 0) {
    stats.averageTimeToApproval = totalApprovalTime / approvalCount;
  }

  return stats;
}

/**
 * Get budget statistics for a business profile
 */
export async function getBudgetStats(
  supabase: any,
  businessProfileId: string,
  months: number = 6
): Promise<BudgetStats> {
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const currentMonthKey = currentMonthStart.toISOString().split('T')[0].substring(0, 7) + '-01';

  // Get current month budget
  const { data: currentLedger, error: ledgerError } = await supabase
    .from('budget_ledger')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .eq('month', currentMonthKey)
    .single();

  if (ledgerError && ledgerError.code !== 'PGRST116') {
    throw new Error(`Failed to get budget stats: ${ledgerError.message}`);
  }

  const currentSpend = currentLedger ? Number(currentLedger.actual_spend) || 0 : 0;
  const currentCap = currentLedger ? Number(currentLedger.monthly_cap) || 0 : 0;
  const remaining = currentCap > 0 ? currentCap - currentSpend : Infinity;
  const percentage = currentCap > 0 ? (currentSpend / currentCap) * 100 : 0;

  // Get budget transactions for category analysis
  // Only query if ledger exists
  let transactions: any[] | null = null;
  if (currentLedger?.id) {
    const { data, error: transError } = await supabase
      .from('budget_transactions')
      .select('amount, category')
      .eq('budget_ledger_id', currentLedger.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (transError && transError.code !== 'PGRST116') {
      // Ignore if no transactions, but log other errors
      console.warn('Failed to get budget transactions:', transError.message);
    } else {
      transactions = data;
    }
  }

  // Calculate top categories
  const categoryTotals: Record<string, number> = {};
  if (transactions) {
    for (const trans of transactions) {
      const category = trans.category || 'uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(trans.amount);
    }
  }

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Calculate average monthly spend (last N months)
  let averageMonthlySpend: number | undefined;
  if (months > 0) {
    const monthKeys: string[] = [];
    for (let i = 0; i < months; i++) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      monthKeys.push(date.toISOString().split('T')[0].substring(0, 7) + '-01');
    }

    const { data: ledgers, error: ledgersError } = await supabase
      .from('budget_ledger')
      .select('actual_spend')
      .eq('business_profile_id', businessProfileId)
      .in('month', monthKeys);

    if (!ledgersError && ledgers && ledgers.length > 0) {
      const totalSpend = ledgers.reduce(
        (sum: number, ledger: any) => sum + (Number(ledger.actual_spend) || 0),
        0
      );
      averageMonthlySpend = totalSpend / ledgers.length;
    }
  }

  return {
    currentMonth: {
      spend: currentSpend,
      cap: currentCap,
      remaining,
      percentage,
    },
    averageMonthlySpend,
    topCategories,
  };
}

/**
 * Get comprehensive analytics for a business profile
 */
export async function getBusinessProfileAnalytics(
  supabase: any,
  businessProfileId: string,
  startDate?: string,
  endDate?: string
): Promise<BusinessProfileAnalytics> {
  const [contentPackStats, budgetStats] = await Promise.all([
    getContentPackStats(supabase, businessProfileId, startDate, endDate),
    getBudgetStats(supabase, businessProfileId, 6),
  ]);

  return {
    contentPackStats,
    budgetStats,
    period: {
      start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: endDate || new Date().toISOString(),
    },
  };
}


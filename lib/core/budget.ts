// Budget enforcement and tracking logic

import type { BudgetLedger, BudgetTransaction } from './types';

/**
 * Get current month budget ledger for a business profile
 * Creates a new ledger entry if one doesn't exist for the current month
 */
export async function getCurrentMonthBudget(
  supabase: any,
  businessProfileId: string
): Promise<BudgetLedger | null> {
  const now = new Date();
  // Use UTC to avoid timezone issues when calculating month key
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = monthStart.toISOString().split('T')[0].substring(0, 7) + '-01';

  // Try to get existing ledger
  const { data, error } = await supabase
    .from('budget_ledger')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .eq('month', monthKey)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" - expected if no ledger exists
    throw new Error(`Failed to get budget ledger: ${error.message}`);
  }

  return data || null;
}

/**
 * Check if an operation would exceed the monthly budget cap
 * Returns true if operation is allowed, false if it would exceed cap
 */
export async function checkBudgetAvailability(
  supabase: any,
  businessProfileId: string,
  operationCost: number
): Promise<{ allowed: boolean; currentSpend: number; monthlyCap: number; remaining: number }> {
  const ledger = await getCurrentMonthBudget(supabase, businessProfileId);

  if (!ledger) {
    // No budget ledger exists - default to allowing (budget not configured)
    return {
      allowed: true,
      currentSpend: 0,
      monthlyCap: 0,
      remaining: Infinity,
    };
  }

  const currentSpend = Number(ledger.actual_spend) || 0;
  const monthlyCap = Number(ledger.monthly_cap) || 0;
  
  // Treat monthlyCap of 0 as unconfigured (same as missing ledger)
  if (monthlyCap === 0) {
    return {
      allowed: true,
      currentSpend: 0,
      monthlyCap: 0,
      remaining: Infinity,
    };
  }
  
  const remaining = monthlyCap - currentSpend;
  const allowed = currentSpend + operationCost <= monthlyCap;

  return {
    allowed,
    currentSpend,
    monthlyCap,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Record a budget transaction (requires service role client)
 * This should only be called from server-side code with elevated privileges
 */
export async function recordBudgetTransaction(
  supabase: any, // Must be service role client
  budgetLedgerId: string,
  amount: number,
  description: string,
  userId: string,
  category?: string,
  provider?: string,
  metadata?: Record<string, unknown>
): Promise<BudgetTransaction> {
  if (amount <= 0) {
    throw new Error('Budget transaction amount must be greater than zero');
  }

  const { data, error } = await supabase
    .from('budget_transactions')
    .insert({
      budget_ledger_id: budgetLedgerId,
      amount,
      description,
      category,
      provider,
      metadata: metadata || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to record budget transaction: ${error.message}`
    );
  }

  return data;
}

/**
 * Enforce budget check before a paid operation
 * Throws an error if the operation would exceed the budget cap
 */
export async function enforceBudgetCheck(
  supabase: any,
  businessProfileId: string,
  operationCost: number,
  operationDescription: string
): Promise<void> {
  const check = await checkBudgetAvailability(supabase, businessProfileId, operationCost);

  if (!check.allowed) {
    throw new Error(
      `Budget exceeded: Cannot perform ${operationDescription}. ` +
        `Current spend: $${check.currentSpend.toFixed(2)}, ` +
        `Monthly cap: $${check.monthlyCap.toFixed(2)}, ` +
        `Operation cost: $${operationCost.toFixed(2)}`
    );
  }
}

/**
 * Get budget ledger for a specific month
 */
export async function getBudgetLedgerForMonth(
  supabase: any,
  businessProfileId: string,
  year: number,
  month: number // 0-indexed (0 = January)
): Promise<BudgetLedger | null> {
  // Use UTC to avoid timezone issues when calculating month key
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthKey = monthStart.toISOString().split('T')[0].substring(0, 7) + '-01';

  const { data, error } = await supabase
    .from('budget_ledger')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .eq('month', monthKey)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get budget ledger: ${error.message}`);
  }

  return data || null;
}


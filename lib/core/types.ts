// Core type definitions for Business Engine

export type ApprovalState = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export type ContentType = 'script' | 'hook' | 'post' | 'video' | 'other';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ContentPack {
  id: string;
  business_profile_id: string;
  created_by: string;
  title: string;
  description?: string;
  content_type: ContentType;
  content_data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: ApprovalState;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface ApprovalWorkflow {
  id: string;
  content_pack_id: string;
  organization_id: string;
  current_state: ApprovalState;
  previous_state?: ApprovalState;
  requested_by: string;
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export interface BudgetLedger {
  id: string;
  business_profile_id: string;
  organization_id: string;
  month: string; // YYYY-MM-01 format
  monthly_cap: number;
  actual_spend: number;
  currency: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetTransaction {
  id: string;
  budget_ledger_id: string;
  amount: number;
  description: string;
  category?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface BusinessProfile {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  market?: string;
  platforms?: string[];
  risk_level: RiskLevel;
  compliance_flags?: string[];
  config?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


// Approval workflow and gating logic

import type { ApprovalState, ApprovalWorkflow, ContentPack } from './types';

/**
 * Valid state transitions for approval workflow
 */
const VALID_TRANSITIONS: Record<ApprovalState, ApprovalState[]> = {
  draft: ['pending_approval'],
  pending_approval: ['approved', 'rejected'],
  approved: [], // Terminal state - cannot transition from approved
  rejected: ['pending_approval'], // Can resubmit after rejection
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  fromState: ApprovalState,
  toState: ApprovalState
): boolean {
  return VALID_TRANSITIONS[fromState]?.includes(toState) ?? false;
}

/**
 * Get approval workflow for a content pack
 */
export async function getApprovalWorkflow(
  supabase: any,
  contentPackId: string
): Promise<ApprovalWorkflow | null> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('content_pack_id', contentPackId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get approval workflow: ${error.message}`);
  }

  return data || null;
}

/**
 * Create or update approval workflow state
 * Validates state transitions and updates content pack status via trigger
 */
export async function updateApprovalWorkflowState(
  supabase: any,
  contentPackId: string,
  newState: ApprovalState,
  userId: string,
  reviewNotes?: string
): Promise<ApprovalWorkflow> {
  // Get existing workflow
  const existing = await getApprovalWorkflow(supabase, contentPackId);

  if (existing) {
    // Validate transition
    if (!isValidTransition(existing.current_state, newState)) {
      throw new Error(
        `Invalid state transition: Cannot transition from ${existing.current_state} to ${newState}`
      );
    }

    // Update existing workflow
    const { data, error } = await supabase
      .from('approval_workflows')
      .update({
        previous_state: existing.current_state,
        current_state: newState,
        reviewed_by: userId,
        review_notes: reviewNotes,
        reviewed_at: newState !== 'pending_approval' ? new Date().toISOString() : null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update approval workflow: ${error.message}`);
    }

    return data;
  } else {
    // Create new workflow (initial submission)
    if (newState !== 'pending_approval') {
      throw new Error('New approval workflow must start with pending_approval state');
    }

    // Get content pack to determine organization
    const { data: contentPack, error: packError } = await supabase
      .from('content_packs')
      .select('business_profile_id, business_profiles!inner(organization_id)')
      .eq('id', contentPackId)
      .single();

    if (packError) {
      throw new Error(`Failed to get content pack: ${packError.message}`);
    }

    const organizationId = (contentPack.business_profiles as any).organization_id;

    const { data, error } = await supabase
      .from('approval_workflows')
      .insert({
        content_pack_id: contentPackId,
        organization_id: organizationId,
        current_state: newState,
        requested_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create approval workflow: ${error.message}`);
    }

    return data;
  }
}

/**
 * Submit content pack for approval (draft → pending_approval)
 */
export async function submitForApproval(
  supabase: any,
  contentPackId: string,
  userId: string
): Promise<ApprovalWorkflow> {
  return updateApprovalWorkflowState(supabase, contentPackId, 'pending_approval', userId);
}

/**
 * Approve content pack (pending_approval → approved)
 */
export async function approveContentPack(
  supabase: any,
  contentPackId: string,
  approverId: string,
  reviewNotes?: string
): Promise<ApprovalWorkflow> {
  return updateApprovalWorkflowState(
    supabase,
    contentPackId,
    'approved',
    approverId,
    reviewNotes
  );
}

/**
 * Reject content pack (pending_approval → rejected)
 */
export async function rejectContentPack(
  supabase: any,
  contentPackId: string,
  reviewerId: string,
  reviewNotes?: string
): Promise<ApprovalWorkflow> {
  return updateApprovalWorkflowState(
    supabase,
    contentPackId,
    'rejected',
    reviewerId,
    reviewNotes
  );
}

/**
 * Check if content pack is approved (gate for exports/operations)
 */
export async function isContentPackApproved(
  supabase: any,
  contentPackId: string
): Promise<boolean> {
  const workflow = await getApprovalWorkflow(supabase, contentPackId);
  return workflow?.current_state === 'approved' || false;
}

/**
 * Enforce approval gate - throws error if content pack is not approved
 */
export async function enforceApprovalGate(
  supabase: any,
  contentPackId: string,
  operationDescription: string
): Promise<void> {
  const approved = await isContentPackApproved(supabase, contentPackId);

  if (!approved) {
    const workflow = await getApprovalWorkflow(supabase, contentPackId);
    const currentState = workflow?.current_state || 'draft';

    throw new Error(
      `Approval required: Cannot perform ${operationDescription}. ` +
        `Content pack status: ${currentState}. ` +
        `Content pack must be approved before this operation.`
    );
  }
}


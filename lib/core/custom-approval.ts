// Custom approval workflow logic

import type { ApprovalWorkflow } from './types';

export interface ApprovalStep {
  stepIndex: number;
  stepName: string;
  approverIds: string[]; // User IDs who can approve this step
  requireAll?: boolean; // If true, all approvers must approve; if false, any one can approve
}

export interface ApprovalWorkflowTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepApproval {
  id: string;
  approval_workflow_id: string;
  step_index: number;
  step_name: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approved_at?: string;
  created_at: string;
}

/**
 * Get approval workflow template for an organization
 */
export async function getApprovalWorkflowTemplate(
  supabase: any,
  organizationId: string,
  templateId?: string
): Promise<ApprovalWorkflowTemplate | null> {
  let query = supabase
    .from('approval_workflow_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (templateId) {
    query = query.eq('id', templateId);
  } else {
    // Get default template (first active one)
    query = query.order('created_at', { ascending: true }).limit(1);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get approval workflow template: ${error.message}`);
  }

  return data || null;
}

/**
 * Initialize custom approval workflow with steps
 */
export async function initializeCustomApprovalWorkflow(
  supabase: any,
  contentPackId: string,
  workflowTemplate: ApprovalWorkflowTemplate,
  userId: string
): Promise<ApprovalWorkflow> {
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

  // Create approval workflow with template reference
  const { data: workflow, error: workflowError } = await supabase
    .from('approval_workflows')
    .insert({
      content_pack_id: contentPackId,
      organization_id: organizationId,
      workflow_template_id: workflowTemplate.id,
      current_state: 'pending_approval',
      requested_by: userId,
    })
    .select()
    .single();

  if (workflowError) {
    throw new Error(`Failed to create approval workflow: ${workflowError.message}`);
  }

  // Create step approvals for first step
  const firstStep = workflowTemplate.steps[0];
  if (firstStep) {
    const stepApprovals = firstStep.approverIds.map((approverId) => ({
      approval_workflow_id: workflow.id,
      step_index: firstStep.stepIndex,
      step_name: firstStep.stepName,
      approver_id: approverId,
      status: 'pending' as const,
    }));

    const { error: stepError } = await supabase
      .from('workflow_step_approvals')
      .insert(stepApprovals);

    if (stepError) {
      throw new Error(`Failed to create step approvals: ${stepError.message}`);
    }
  }

  return workflow;
}

/**
 * Approve a workflow step
 */
export async function approveWorkflowStep(
  supabase: any,
  approvalWorkflowId: string,
  stepIndex: number,
  approverId: string,
  notes?: string
): Promise<WorkflowStepApproval> {
  // Update the step approval
  const { data, error } = await supabase
    .from('workflow_step_approvals')
    .update({
      status: 'approved',
      notes,
      approved_at: new Date().toISOString(),
    })
    .eq('approval_workflow_id', approvalWorkflowId)
    .eq('step_index', stepIndex)
    .eq('approver_id', approverId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve workflow step: ${error.message}`);
  }

  // Check if step is complete and move to next step
  await checkAndAdvanceWorkflow(supabase, approvalWorkflowId);

  return data;
}

/**
 * Reject a workflow step (rejects entire workflow)
 */
export async function rejectWorkflowStep(
  supabase: any,
  approvalWorkflowId: string,
  stepIndex: number,
  approverId: string,
  notes?: string
): Promise<WorkflowStepApproval> {
  // Update the step approval
  const { data, error } = await supabase
    .from('workflow_step_approvals')
    .update({
      status: 'rejected',
      notes,
      approved_at: new Date().toISOString(),
    })
    .eq('approval_workflow_id', approvalWorkflowId)
    .eq('step_index', stepIndex)
    .eq('approver_id', approverId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reject workflow step: ${error.message}`);
  }

  // Reject entire workflow
  const { error: workflowError } = await supabase
    .from('approval_workflows')
    .update({
      current_state: 'rejected',
      reviewed_by: approverId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', approvalWorkflowId);

  if (workflowError) {
    throw new Error(`Failed to reject workflow: ${workflowError.message}`);
  }

  return data;
}

/**
 * Check if current step is complete and advance to next step
 */
async function checkAndAdvanceWorkflow(
  supabase: any,
  approvalWorkflowId: string
): Promise<void> {
  // Get workflow with template
  const { data: workflow, error: workflowError } = await supabase
    .from('approval_workflows')
    .select('*, approval_workflow_templates!inner(steps)')
    .eq('id', approvalWorkflowId)
    .single();

  if (workflowError || !workflow) {
    return;
  }

  const template = workflow.approval_workflow_templates;
  if (!template || !template.steps) {
    return;
  }

  // Get ALL step approvals (pending, approved, rejected) to properly track workflow state
  const { data: allStepApprovals, error: approvalsError } = await supabase
    .from('workflow_step_approvals')
    .select('*')
    .eq('approval_workflow_id', approvalWorkflowId);

  if (approvalsError) {
    return;
  }

  // Find current step (first incomplete step)
  const steps = template.steps as ApprovalStep[];
  let currentStepIndex = -1;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    // Filter for approved approvals for this step to check completion
    const approvedApprovalsForStep = (allStepApprovals || []).filter(
      (sa: WorkflowStepApproval) =>
        sa.step_index === step.stepIndex && sa.status === 'approved'
    );

    const requiredApprovals = step.requireAll
      ? step.approverIds.length
      : 1;
    const approvedCount = approvedApprovalsForStep.length;

    if (approvedCount < requiredApprovals) {
      currentStepIndex = i;
      break;
    }
  }

  // If all steps are complete, approve the workflow
  if (currentStepIndex === -1) {
    // Get the last approver from the final step approvals
    const finalStepApprovals = (allStepApprovals || []).filter(
      (sa: WorkflowStepApproval) => sa.status === 'approved'
    );
    const lastApprover = finalStepApprovals.length > 0 
      ? finalStepApprovals[finalStepApprovals.length - 1].approver_id 
      : null;

    const { error: approveError } = await supabase
      .from('approval_workflows')
      .update({
        current_state: 'approved',
        reviewed_by: lastApprover, // Set reviewed_by to last approver for audit trail
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', approvalWorkflowId);

    if (approveError) {
      throw new Error(`Failed to approve workflow: ${approveError.message}`);
    }

    return;
  }

  // If we've moved to a new step, create approvals for it
  const currentStep = steps[currentStepIndex];
  // Check for ANY existing approvals (pending, approved, rejected) to avoid duplicates
  const existingApprovals = (allStepApprovals || []).filter(
    (sa: WorkflowStepApproval) => sa.step_index === currentStep.stepIndex
  );

  if (existingApprovals.length === 0) {
    const stepApprovalsToCreate = currentStep.approverIds.map((approverId) => ({
      approval_workflow_id: approvalWorkflowId,
      step_index: currentStep.stepIndex,
      step_name: currentStep.stepName,
      approver_id: approverId,
      status: 'pending' as const,
    }));

    const { error: insertError } = await supabase
      .from('workflow_step_approvals')
      .insert(stepApprovalsToCreate);

    if (insertError) {
      throw new Error(`Failed to create step approvals: ${insertError.message}`);
    }
  }
}

/**
 * Get workflow step approvals for a workflow
 */
export async function getWorkflowStepApprovals(
  supabase: any,
  approvalWorkflowId: string
): Promise<WorkflowStepApproval[]> {
  const { data, error } = await supabase
    .from('workflow_step_approvals')
    .select('*')
    .eq('approval_workflow_id', approvalWorkflowId)
    .order('step_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get workflow step approvals: ${error.message}`);
  }

  return data || [];
}


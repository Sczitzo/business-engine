// API route for custom approval workflow operations

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import {
  initializeCustomApprovalWorkflow,
  approveWorkflowStep,
  rejectWorkflowStep,
  getWorkflowStepApprovals,
  getApprovalWorkflowTemplate,
} from '@/lib/core/custom-approval';

// POST /api/approval/workflow
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, contentPackId, workflowTemplateId, stepIndex, notes } = body;

    if (action === 'initialize' && contentPackId && workflowTemplateId) {
      // Get organization from content pack
      const { data: contentPack, error: packError } = await supabase
        .from('content_packs')
        .select('business_profiles!inner(organization_id)')
        .eq('id', contentPackId)
        .single();

      if (packError) {
        return NextResponse.json(
          { error: 'Content pack not found' },
          { status: 404 }
        );
      }

      const organizationId = (contentPack.business_profiles as any).organization_id;

      // Initialize custom workflow
      const template = await getApprovalWorkflowTemplate(supabase, organizationId, workflowTemplateId);
      if (!template) {
        return NextResponse.json({ error: 'Workflow template not found' }, { status: 404 });
      }

      const workflow = await initializeCustomApprovalWorkflow(
        supabase,
        contentPackId,
        template,
        user.id
      );

      return NextResponse.json(workflow);
    }

    if (action === 'approve' && body.approvalWorkflowId && stepIndex !== undefined) {
      // Approve workflow step
      const stepApproval = await approveWorkflowStep(
        supabase,
        body.approvalWorkflowId,
        stepIndex,
        user.id,
        notes
      );

      return NextResponse.json(stepApproval);
    }

    if (action === 'reject' && body.approvalWorkflowId && stepIndex !== undefined) {
      // Reject workflow step
      const stepApproval = await rejectWorkflowStep(
        supabase,
        body.approvalWorkflowId,
        stepIndex,
        user.id,
        notes
      );

      return NextResponse.json(stepApproval);
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/approval/workflow?approvalWorkflowId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const approvalWorkflowId = searchParams.get('approvalWorkflowId');

    if (!approvalWorkflowId) {
      return NextResponse.json(
        { error: 'approvalWorkflowId is required' },
        { status: 400 }
      );
    }

    const stepApprovals = await getWorkflowStepApprovals(supabase, approvalWorkflowId);

    return NextResponse.json(stepApprovals);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


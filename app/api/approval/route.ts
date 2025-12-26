// API route for approval workflow operations

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import {
  submitForApproval,
  approveContentPack,
  rejectContentPack,
  getApprovalWorkflow,
} from '@/lib/core/approval';

// POST /api/approval/submit
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, contentPackId, reviewNotes } = body;

    if (!action || !contentPackId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, contentPackId' },
        { status: 400 }
      );
    }

    let workflow;

    switch (action) {
      case 'submit':
        workflow = await submitForApproval(supabase, contentPackId, user.id);
        break;

      case 'approve':
        workflow = await approveContentPack(supabase, contentPackId, user.id, reviewNotes);
        break;

      case 'reject':
        workflow = await rejectContentPack(supabase, contentPackId, user.id, reviewNotes);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be 'submit', 'approve', or 'reject'` },
          { status: 400 }
        );
    }

    return NextResponse.json(workflow);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/approval?contentPackId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contentPackId = searchParams.get('contentPackId');

    if (!contentPackId) {
      return NextResponse.json(
        { error: 'contentPackId is required' },
        { status: 400 }
      );
    }

    const workflow = await getApprovalWorkflow(supabase, contentPackId);

    if (!workflow) {
      return NextResponse.json({ error: 'Approval workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


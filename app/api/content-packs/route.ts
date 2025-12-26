// API route for content pack operations

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import {
  createContentPack,
  getContentPack,
  getContentPacksForBusinessProfile,
  updateContentPack,
  deleteContentPack,
} from '@/lib/core/content-pack';
import type { ContentType } from '@/lib/core/types';

// GET /api/content-packs?businessProfileId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const businessProfileId = searchParams.get('businessProfileId');
    const status = searchParams.get('status') || undefined;
    const contentPackId = searchParams.get('id');

    if (contentPackId) {
      // Get single content pack
      const contentPack = await getContentPack(supabase, contentPackId);
      if (!contentPack) {
        return NextResponse.json({ error: 'Content pack not found' }, { status: 404 });
      }
      return NextResponse.json(contentPack);
    }

    if (!businessProfileId) {
      return NextResponse.json(
        { error: 'businessProfileId is required' },
        { status: 400 }
      );
    }

    // Get all content packs for business profile
    const contentPacks = await getContentPacksForBusinessProfile(
      supabase,
      businessProfileId,
      status
    );

    return NextResponse.json(contentPacks);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/content-packs
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessProfileId,
      title,
      contentType,
      contentData,
      description,
      metadata,
    } = body;

    if (!businessProfileId || !title || !contentType || !contentData) {
      return NextResponse.json(
        { error: 'Missing required fields: businessProfileId, title, contentType, contentData' },
        { status: 400 }
      );
    }

    const contentPack = await createContentPack(
      supabase,
      businessProfileId,
      user.id,
      title,
      contentType as ContentType,
      contentData,
      description,
      metadata
    );

    return NextResponse.json(contentPack, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/content-packs?id=xxx
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contentPackId = searchParams.get('id');

    if (!contentPackId) {
      return NextResponse.json(
        { error: 'Content pack id is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, content_data, metadata } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (content_data !== undefined) updates.content_data = content_data;
    if (metadata !== undefined) updates.metadata = metadata;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const contentPack = await updateContentPack(supabase, contentPackId, updates);

    return NextResponse.json(contentPack);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/content-packs?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseUserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contentPackId = searchParams.get('id');

    if (!contentPackId) {
      return NextResponse.json(
        { error: 'Content pack id is required' },
        { status: 400 }
      );
    }

    await deleteContentPack(supabase, contentPackId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


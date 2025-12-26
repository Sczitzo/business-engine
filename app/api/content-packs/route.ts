// API route for content pack operations

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../middleware';
import {
  createContentPack,
  getContentPack,
  getContentPacksForBusinessProfile,
  updateContentPack,
  deleteContentPack,
} from '@/lib/core/content-pack';
import type { ContentType } from '@/lib/core/types';
import { handleApiError, ValidationError, NotFoundError } from '@/lib/utils/errors';
import { validateUUID, validateRequired, validateEnum, validateLength } from '@/lib/utils/validation';

// GET /api/content-packs?businessProfileId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const businessProfileId = searchParams.get('businessProfileId');
    const status = searchParams.get('status') || undefined;
    const contentPackId = searchParams.get('id');

    if (contentPackId) {
      // Validate UUID
      validateUUID(contentPackId, 'contentPackId');
      
      // Get single content pack
      const contentPack = await getContentPack(supabase, contentPackId);
      if (!contentPack) {
        throw new NotFoundError('Content pack', contentPackId);
      }
      return NextResponse.json(contentPack);
    }

    if (!businessProfileId) {
      throw new ValidationError('businessProfileId is required', 'businessProfileId');
    }

    validateUUID(businessProfileId, 'businessProfileId');

    // Validate status if provided and use validated value
    let validatedStatus: string | undefined = status;
    if (status) {
      validatedStatus = validateEnum(status, ['draft', 'pending_approval', 'approved', 'rejected'], 'status');
    }

    // Get all content packs for business profile
    const contentPacks = await getContentPacksForBusinessProfile(
      supabase,
      businessProfileId,
      validatedStatus
    );

    return NextResponse.json(contentPacks);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// POST /api/content-packs
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const body = await request.json();
    const {
      businessProfileId,
      title,
      contentType,
      contentData,
      description,
      metadata,
    } = body;

    // Validate required fields
    validateRequired(businessProfileId, 'businessProfileId');
    validateRequired(title, 'title');
    validateRequired(contentType, 'contentType');
    
    if (!contentData || typeof contentData !== 'object') {
      throw new ValidationError('contentData is required and must be an object', 'contentData');
    }

    // Validate UUID
    validateUUID(businessProfileId, 'businessProfileId');

    // Validate content type
    const validContentType = validateEnum(
      contentType,
      ['script', 'hook', 'post', 'video', 'other'],
      'contentType'
    );

    // Validate title length
    validateLength(title, 1, 200, 'title');

    // Validate description length if provided
    if (description) {
      validateLength(description, 0, 1000, 'description');
    }

    const contentPack = await createContentPack(
      supabase,
      businessProfileId,
      user.id,
      title,
      validContentType,
      contentData,
      description,
      metadata
    );

    return NextResponse.json(contentPack, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// PATCH /api/content-packs?id=xxx
export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const contentPackId = searchParams.get('id');

    if (!contentPackId) {
      throw new ValidationError('Content pack id is required', 'id');
    }

    validateUUID(contentPackId, 'contentPackId');

    const body = await request.json();
    const { title, description, content_data, metadata } = body;

    const updates: any = {};
    if (title !== undefined) {
      validateLength(title, 1, 200, 'title');
      updates.title = title;
    }
    if (description !== undefined) {
      validateLength(description, 0, 1000, 'description');
      updates.description = description;
    }
    if (content_data !== undefined) {
      if (typeof content_data !== 'object') {
        throw new ValidationError('content_data must be an object', 'content_data');
      }
      updates.content_data = content_data;
    }
    if (metadata !== undefined) {
      if (typeof metadata !== 'object') {
        throw new ValidationError('metadata must be an object', 'metadata');
      }
      updates.metadata = metadata;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No updates provided');
    }

    const contentPack = await updateContentPack(supabase, contentPackId, updates);

    return NextResponse.json(contentPack);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// DELETE /api/content-packs?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const contentPackId = searchParams.get('id');

    if (!contentPackId) {
      throw new ValidationError('Content pack id is required', 'id');
    }

    validateUUID(contentPackId, 'contentPackId');

    await deleteContentPack(supabase, contentPackId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}


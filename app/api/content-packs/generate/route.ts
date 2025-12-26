// API route for AI-powered content pack generation

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserClient } from '@/lib/supabase/server';
import { generateContentPack } from '@/lib/core/content-generation';
import type { ContentType } from '@/lib/core/types';

// POST /api/content-packs/generate
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
      prompt,
      systemPrompt,
      aiProvider,
      model,
      description,
      metadata,
    } = body;

    if (
      !businessProfileId ||
      !title ||
      !contentType ||
      !prompt ||
      !aiProvider
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: businessProfileId, title, contentType, prompt, aiProvider',
        },
        { status: 400 }
      );
    }

    if (!['openai', 'anthropic'].includes(aiProvider)) {
      return NextResponse.json(
        { error: 'Invalid AI provider. Must be "openai" or "anthropic"' },
        { status: 400 }
      );
    }

    const result = await generateContentPack(supabase, {
      businessProfileId,
      userId: user.id,
      title,
      contentType: contentType as ContentType,
      prompt,
      systemPrompt,
      aiProvider,
      model,
      description,
      metadata,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


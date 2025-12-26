// Content pack generation using AI providers

import { createAIAdapter, getAIProviderConfig } from '@/lib/adapters/ai';
import { createContentPack } from './content-pack';
import type { ContentType } from './types';

export interface ContentGenerationRequest {
  businessProfileId: string;
  userId: string;
  title: string;
  contentType: ContentType;
  prompt: string;
  systemPrompt?: string;
  aiProvider: 'openai' | 'anthropic';
  model?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate content pack using AI provider
 */
export async function generateContentPack(
  supabase: any,
  request: ContentGenerationRequest
) {
  // Get AI provider configuration
  const aiConfig = await getAIProviderConfig(
    supabase,
    request.businessProfileId,
    request.aiProvider
  );

  if (!aiConfig || !aiConfig.enabled) {
    throw new Error(
      `AI provider ${request.aiProvider} is not configured or enabled for this business profile`
    );
  }

  // Create AI adapter
  const adapter = createAIAdapter(
    request.businessProfileId,
    request.userId,
    aiConfig
  );

  // Generate content with budget enforcement
  const aiResponse = await adapter.generateWithBudget({
    prompt: request.prompt,
    systemPrompt: request.systemPrompt,
    model: request.model || aiConfig.model,
    maxTokens: request.metadata?.maxTokens as number | undefined,
    temperature: request.metadata?.temperature as number | undefined,
  });

  // Create content pack with generated content
  const contentData = {
    generated: true,
    aiProvider: request.aiProvider,
    model: aiResponse.model,
    prompt: request.prompt,
    systemPrompt: request.systemPrompt,
    content: aiResponse.content,
    usage: aiResponse.usage,
    generatedAt: new Date().toISOString(),
  };

  const contentPack = await createContentPack(
    supabase,
    request.businessProfileId,
    request.userId,
    request.title,
    request.contentType,
    contentData,
    request.description,
    {
      ...request.metadata,
      aiGeneration: {
        provider: request.aiProvider,
        model: aiResponse.model,
        tokens: aiResponse.usage.totalTokens,
      },
    }
  );

  return {
    contentPack,
    aiResponse,
  };
}


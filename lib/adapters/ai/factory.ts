// AI provider factory

import { OpenAIAdapter } from './openai';
import { AnthropicAdapter } from './anthropic';
import type { AIProviderAdapter, AIProviderConfig } from './types';

/**
 * Create AI provider adapter based on configuration
 */
export function createAIAdapter(
  businessProfileId: string,
  userId: string,
  config: AIProviderConfig
): AIProviderAdapter {
  if (!config.enabled) {
    throw new Error(`AI provider ${config.provider} is not enabled`);
  }

  switch (config.provider) {
    case 'openai':
      return new OpenAIAdapter(businessProfileId, userId, config);
    case 'anthropic':
      return new AnthropicAdapter(businessProfileId, userId, config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Get AI provider configuration from business profile
 */
export async function getAIProviderConfig(
  supabase: any,
  businessProfileId: string,
  provider: 'openai' | 'anthropic'
): Promise<AIProviderConfig | null> {
  const { data: profile, error } = await supabase
    .from('business_profiles')
    .select('config')
    .eq('id', businessProfileId)
    .single();

  if (error || !profile) {
    return null;
  }

  const aiConfig = profile.config?.ai_providers?.[provider];
  if (!aiConfig) {
    return null;
  }

  return {
    provider,
    ...aiConfig,
  } as AIProviderConfig;
}


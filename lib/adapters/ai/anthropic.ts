// Anthropic Claude adapter implementation

import { BaseAIAdapter } from './base';
import type { AIProviderAdapter, AIGenerationRequest, AIGenerationResponse } from './types';

// Anthropic pricing (as of 2024) - update as needed
const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-opus': { input: 0.015 / 1000, output: 0.075 / 1000 },
  'claude-3-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 },
  'claude-3-haiku': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
};

const DEFAULT_MODEL = 'claude-3-haiku';

export class AnthropicAdapter extends BaseAIAdapter implements AIProviderAdapter {
  private apiKey: string;
  private defaultModel: string;

  constructor(businessProfileId: string, userId: string, config: any) {
    super(businessProfileId, userId, config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.defaultModel = config.model || DEFAULT_MODEL;

    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const model = request.model || this.defaultModel;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature ?? 0.7,
        messages: [{ role: 'user', content: request.prompt }],
        ...(request.systemPrompt && { system: request.systemPrompt }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0];

    return {
      content: content.text,
      model: data.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      metadata: {
        stopReason: data.stop_reason,
      },
    };
  }

  async estimateCost(request: AIGenerationRequest): Promise<number> {
    const model = request.model || this.defaultModel;
    const pricing = ANTHROPIC_PRICING[model] || ANTHROPIC_PRICING[DEFAULT_MODEL];

    // Rough estimate: assume 100 tokens for prompt, 500 for completion
    const estimatedPromptTokens = request.prompt.length / 4;
    const estimatedCompletionTokens = request.maxTokens || 500;

    return (
      estimatedPromptTokens * pricing.input + estimatedCompletionTokens * pricing.output
    );
  }

  protected calculateCost(
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
    model: string
  ): number {
    // Use the actual model from the response, not the default
    const pricing = ANTHROPIC_PRICING[model] || ANTHROPIC_PRICING[DEFAULT_MODEL];

    return usage.promptTokens * pricing.input + usage.completionTokens * pricing.output;
  }

  getProviderName(): string {
    return 'anthropic';
  }
}


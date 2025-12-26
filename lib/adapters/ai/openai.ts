// OpenAI adapter implementation

import { BaseAIAdapter } from './base';
import type { AIProviderAdapter, AIGenerationRequest, AIGenerationResponse } from './types';

// OpenAI pricing (as of 2024) - update as needed
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
  'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
  'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
};

const DEFAULT_MODEL = 'gpt-3.5-turbo';

export class OpenAIAdapter extends BaseAIAdapter implements AIProviderAdapter {
  private apiKey: string;
  private defaultModel: string;

  constructor(businessProfileId: string, userId: string, config: any) {
    super(businessProfileId, userId, config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.defaultModel = config.model || DEFAULT_MODEL;

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const model = request.model || this.defaultModel;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(request.systemPrompt
            ? [{ role: 'system', content: request.systemPrompt }]
            : []),
          { role: 'user', content: request.prompt },
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      metadata: {
        finishReason: choice.finish_reason,
      },
    };
  }

  async estimateCost(request: AIGenerationRequest): Promise<number> {
    const model = request.model || this.defaultModel;
    const pricing = OPENAI_PRICING[model] || OPENAI_PRICING[DEFAULT_MODEL];

    // Rough estimate: assume 100 tokens for prompt, 500 for completion
    const estimatedPromptTokens = request.prompt.length / 4; // Rough token estimate
    const estimatedCompletionTokens = request.maxTokens || 500;

    return (
      estimatedPromptTokens * pricing.input + estimatedCompletionTokens * pricing.output
    );
  }

  protected calculateCost(usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }): number {
    const model = this.defaultModel;
    const pricing = OPENAI_PRICING[model] || OPENAI_PRICING[DEFAULT_MODEL];

    return usage.promptTokens * pricing.input + usage.completionTokens * pricing.output;
  }

  getProviderName(): string {
    return 'openai';
  }
}


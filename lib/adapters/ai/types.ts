// AI provider adapter types

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
}

export interface AIGenerationRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIGenerationResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AIProviderAdapter {
  generate(request: AIGenerationRequest): Promise<AIGenerationResponse>;
  generateWithBudget(request: AIGenerationRequest): Promise<AIGenerationResponse>;
  estimateCost(request: AIGenerationRequest): Promise<number>;
  getProviderName(): string;
}


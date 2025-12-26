// Base AI provider adapter with budget and approval integration

import type { AIProviderAdapter, AIGenerationRequest, AIGenerationResponse } from './types';
import { enforceBudgetCheck } from '@/lib/core/budget';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getCurrentMonthBudget, recordBudgetTransaction } from '@/lib/core/budget';

/**
 * Base class for AI provider adapters
 * Handles budget enforcement and transaction logging
 */
export abstract class BaseAIAdapter implements AIProviderAdapter {
  protected businessProfileId: string;
  protected userId: string;
  protected config: any;

  constructor(businessProfileId: string, userId: string, config: any) {
    this.businessProfileId = businessProfileId;
    this.userId = userId;
    this.config = config;
  }

  /**
   * Generate content with budget enforcement
   */
  async generateWithBudget(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse> {
    // Estimate cost before generation
    const estimatedCost = await this.estimateCost(request);

    // Enforce budget check
    const supabase = await import('@/lib/supabase/server').then((m) =>
      m.getSupabaseUserClient()
    );
    await enforceBudgetCheck(
      supabase,
      this.businessProfileId,
      estimatedCost,
      `AI generation (${this.getProviderName()})`
    );

    // Perform generation
    const response = await this.generate(request);

    // Record actual cost (may differ from estimate)
    // Pass model from response to ensure correct pricing
    const actualCost = this.calculateCost(response.usage, response.model);
    await this.recordAITransaction(request, response, actualCost);

    return response;
  }

  /**
   * Record AI API call to budget ledger
   */
  private async recordAITransaction(
    request: AIGenerationRequest,
    response: AIGenerationResponse,
    cost: number
  ): Promise<void> {
    if (cost <= 0) return; // Skip recording free operations

    const supabase = getSupabaseServiceClient();
    const budgetLedger = await getCurrentMonthBudget(supabase, this.businessProfileId);

    if (!budgetLedger) {
      // No budget ledger exists - skip recording
      return;
    }

    await recordBudgetTransaction(
      supabase,
      budgetLedger.id,
      cost,
      `AI API call: ${this.getProviderName()} - ${response.model}`,
      this.userId,
      'ai_api_call',
      this.getProviderName(),
      {
        model: response.model,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      }
    );
  }

  /**
   * Calculate cost based on token usage and model
   * Override in subclasses for provider-specific pricing
   */
  protected abstract calculateCost(
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
    model: string
  ): number;

  /**
   * Generate content - must be implemented by provider
   */
  abstract generate(request: AIGenerationRequest): Promise<AIGenerationResponse>;

  /**
   * Estimate cost before generation
   */
  abstract estimateCost(request: AIGenerationRequest): Promise<number>;

  /**
   * Get provider name
   */
  abstract getProviderName(): string;
}


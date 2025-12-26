// Startup validation - run on server startup

import { validateEnv } from '@/lib/utils/env';

/**
 * Validate environment and configuration on startup
 * Call this in your app initialization
 */
export function runStartupChecks(): void {
  try {
    validateEnv();
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Startup validation failed:', error);
    throw error;
  }
}


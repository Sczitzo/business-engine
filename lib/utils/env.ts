// Environment variable validation

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

const optionalEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
} as const;

/**
 * Validate required environment variables
 * Throws error if any are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: keyof typeof requiredEnvVars | keyof typeof optionalEnvVars): string {
  const value = process.env[key];
  
  if (key in requiredEnvVars && (!value || value.trim() === '')) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || '';
}

/**
 * Check if optional environment variable is set
 */
export function hasEnv(key: keyof typeof optionalEnvVars): boolean {
  const value = process.env[key];
  return !!value && value.trim() !== '';
}


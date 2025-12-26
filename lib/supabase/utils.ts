// Supabase utility functions

/**
 * Check if a Supabase error is a "not found" error
 * PGRST116 is the error code for "no rows returned" from .single() queries
 */
export function isNotFoundError(error: any): boolean {
  return error?.code === 'PGRST116';
}

/**
 * Handle Supabase query errors
 * Returns null for "not found" errors, throws for other errors
 */
export function handleSupabaseError<T>(
  data: T | null,
  error: any,
  errorMessage: string
): T | null {
  if (error && !isNotFoundError(error)) {
    throw new Error(`${errorMessage}: ${error.message}`);
  }
  return data || null;
}


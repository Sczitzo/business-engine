// Input validation utilities

import { ValidationError } from './errors';

/**
 * Validate UUID format
 */
export function validateUUID(value: string, fieldName: string): void {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid UUID format for ${fieldName}`, fieldName);
  }
}

/**
 * Validate email format
 */
export function validateEmail(value: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new ValidationError(`Invalid email format for ${fieldName}`, fieldName);
  }
}

/**
 * Validate required string
 */
export function validateRequired(
  value: string | undefined | null,
  fieldName: string
): void {
  if (!value || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value.length < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min} characters`,
      fieldName
    );
  }
  if (value.length > max) {
    throw new ValidationError(
      `${fieldName} must be at most ${max} characters`,
      fieldName
    );
  }
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}`,
      fieldName
    );
  }
}

/**
 * Validate positive number
 */
export function validatePositive(value: number, fieldName: string): void {
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be greater than 0`, fieldName);
  }
}

/**
 * Validate non-negative number
 */
export function validateNonNegative(value: number, fieldName: string): void {
  if (value < 0) {
    throw new ValidationError(`${fieldName} must be greater than or equal to 0`, fieldName);
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }
  return value as T;
}


// Centralized error types and handling

export class BusinessEngineError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessEngineError';
  }
}

export class ApprovalError extends BusinessEngineError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'ApprovalError';
  }
}

export class BudgetError extends BusinessEngineError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'BudgetError';
  }
}

export class ContentPackError extends BusinessEngineError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'ContentPackError';
  }
}


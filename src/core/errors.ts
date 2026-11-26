// Custom Application Error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    stack = '',
    errorCode?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, errorCode = 'VALIDATION_ERROR') {
    super(message, 422, true, '', errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode = 'NOT_FOUND') {
    super(message, 404, true, '', errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    super(message, 401, true, '', errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', errorCode = 'FORBIDDEN') {
    super(message, 403, true, '', errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', errorCode = 'CONFLICT') {
    super(message, 409, true, '', errorCode);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Payment required', errorCode = 'PAYMENT_FAILED') {
    super(message, 402, true, '', errorCode);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', errorCode = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, true, '', errorCode);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, true, '', errorCode);
  }
}

// Error codes enum
export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
}

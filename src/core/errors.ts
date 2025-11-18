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
  constructor(message: string, errorCode?: string) {
    super(message, 400, true, '', errorCode);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode?: string) {
    super(message, 404, true, '', errorCode || 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', errorCode?: string) {
    super(message, 401, true, '', errorCode || 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', errorCode?: string) {
    super(message, 403, true, '', errorCode || 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', errorCode?: string) {
    super(message, 409, true, '', errorCode || 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', errorCode?: string) {
    super(message, 500, true, '', errorCode || 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

// Error codes enum
export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
}
// Custom Application Error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    stack = '',
    errorCode?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, errorCode?: string, details?: any) {
    super(message, 400, true, '', errorCode, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode?: string, details?: any) {
    super(message, 404, true, '', errorCode || 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', errorCode?: string, details?: any) {
    super(message, 401, true, '', errorCode || 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', errorCode?: string, details?: any) {
    super(message, 403, true, '', errorCode || 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', errorCode?: string, details?: any) {
    super(message, 409, true, '', errorCode || 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', errorCode?: string, details?: any) {
    super(message, 500, true, '', errorCode || 'INTERNAL_SERVER_ERROR', details);
    this.name = 'InternalServerError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errorCode?: string, details?: any) {
    super(message, 400, true, '', errorCode || 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests', errorCode?: string, details?: any) {
    super(message, 429, true, '', errorCode || 'TOO_MANY_REQUESTS', details);
    this.name = 'TooManyRequestsError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database Error', errorCode?: string, details?: any) {
    super(message, 500, true, '', errorCode || 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication Error', errorCode?: string, details?: any) {
    super(message, 401, true, '', errorCode || 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Authorization Error', errorCode?: string, details?: any) {
    super(message, 403, true, '', errorCode || 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment Error', errorCode?: string, details?: any) {
    super(message, 402, true, '', errorCode || 'PAYMENT_ERROR', details);
    this.name = 'PaymentError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string = 'Business Logic Error', errorCode?: string, details?: any) {
    super(message, 422, true, '', errorCode || 'BUSINESS_LOGIC_ERROR', details);
    this.name = 'BusinessLogicError';
  }
}

// Error codes enum
export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
}
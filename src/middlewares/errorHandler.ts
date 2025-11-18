import { Elysia } from 'elysia';
import { logger } from './logging';
import { errorResponse } from '../core/responses';
import { AppError } from '../core/errors';

export const errorHandler = new Elysia({ name: 'errorHandler' })
  .error({
    APP_ERROR: AppError,
  })
  .onError(({ code, error, set }) => {
    // Log the error
    logger.error('Application error occurred:', {
      code,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Set appropriate status code
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return errorResponse(
        error.message,
        error.errorCode || code,
        error.statusCode,
        error
      );
    }

    // Default error response for unhandled errors
    set.status = 500;
    return errorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500,
      error
    );
  });
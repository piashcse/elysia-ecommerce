import { Elysia } from 'elysia';
import { errorResponse } from '../core/responses';
import { AppError } from '../core/errors';

export const errorHandler = new Elysia({ name: 'errorHandler' })
  .error({
    APP_ERROR: AppError,
  })
  .onError(({ code, error, set }) => {
    // Log the error using console.error since elysia-logger may not provide logger in onError hook
    const err = error as any;
    console.error('Application error occurred:', {
      code,
      message: err.message || 'Unknown error',
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });

    // Set appropriate status code
    if (code === 'VALIDATION' || code === 'PARSE') {
      set.status = 400;
      let message = error.message;
      let details = error;

      try {
        // Elysia's validation error message is often a stringified JSON
        const parsed = JSON.parse(error.message);
        if (parsed.summary) message = parsed.summary;
        details = parsed;
      } catch (e) {
        // Not a JSON string, use as is
      }

      return errorResponse(
        message,
        code.toString(),
        400,
        details
      );
    }

    if (error instanceof AppError) {
      set.status = error.statusCode;
      return errorResponse(
        error.message,
        (error.errorCode || code).toString(),
        error.statusCode,
        error
      );
    }

    // Default error response for unhandled errors
    const statusCode = err.status || err.statusCode || 500;
    set.status = statusCode;
    return errorResponse(
      err.message || 'Internal server error',
      (err.code || code).toString(),
      statusCode,
      err
    );
  });
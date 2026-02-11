import { Elysia } from 'elysia';
import { errorResponse } from '../../core/responses';
import { AppError } from '../../core/errors';
import { logger } from '../../utils/logging';
import { z } from 'zod';

export const enhancedErrorHandler = new Elysia({ name: 'enhanced-error-handler' })
  .error({
    APP_ERROR: AppError,
  })
  .onError(({ code, error, set, path, request }) => {
    // Log the error with detailed context
    logger.error('Application error occurred', error, {
      code,
      path,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // Handle validation errors specifically
    if (code === 'VALIDATION' || code === 'PARSE') {
      set.status = 422;
      let message = error.message;
      let details = error;

      try {
        // Try to parse Elysia's validation error message
        const parsed = JSON.parse(error.message);
        if (parsed.summary) message = parsed.summary;
        details = parsed;
      } catch (e) {
        // If it's not JSON, try to parse as Zod error
        try {
          if (error.message.includes('"issues"')) {
            // This might be a Zod-like error
            const zodError = z.ZodError.create([{ message: error.message, path: [] }]);
            message = zodError.issues.map(issue => issue.message).join(', ');
          }
        } catch (parseErr) {
          // If all parsing fails, use the original message
        }
      }

      logger.warn('Validation error', { path, message, details });
      return errorResponse(message, code.toString(), 422, details);
    }

    // Handle AppError instances
    if (error instanceof AppError) {
      const appErr = error as AppError;
      set.status = appErr.statusCode;
      
      logger.warn('App error', { 
        path, 
        message: appErr.message, 
        errorCode: appErr.errorCode,
        statusCode: appErr.statusCode 
      });
      
      return errorResponse(
        appErr.message, 
        (appErr.errorCode || code).toString(), 
        appErr.statusCode, 
        appErr.details
      );
    }

    // Handle database errors specifically
    if (error.message.includes('database') || error.message.includes('SQL')) {
      set.status = 500;
      logger.error('Database error', { path, error: error.message });
      return errorResponse(
        'Database error occurred', 
        'DATABASE_ERROR', 
        500, 
        { originalError: error.message }
      );
    }

    // Default error response for unhandled errors
    const statusCode = error.status || error.statusCode || 500;
    set.status = statusCode;
    
    logger.error('Unhandled error', { 
      path, 
      message: error.message || 'Internal server error', 
      originalError: error 
    });
    
    return errorResponse(
      error.message || 'Internal server error', 
      (error.code || code).toString(), 
      statusCode, 
      error
    );
  });

// Performance monitoring middleware
export const performanceMiddleware = new Elysia({ name: 'performance-monitor' })
  .derive(async ({ request }) => {
    const startTime = Date.now();
    return { startTime };
  })
  .onAfterHandle(({ startTime, path, request, response }) => {
    const duration = Date.now() - startTime;
    
    // Log slow requests (over 500ms)
    if (duration > 500) {
      logger.warn('Slow request detected', {
        path,
        method: request.method,
        duration,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Add performance headers in development
    if (process.env.NODE_ENV === 'development') {
      (response as any).headers = {
        ...(response as any).headers,
        'X-Response-Time': `${duration}ms`,
      };
    }
  });

// Request ID middleware for tracing
export const requestIdMiddleware = new Elysia({ name: 'request-id' })
  .derive(async () => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { requestId };
  })
  .onBeforeHandle(({ requestId, set }) => {
    set.headers['X-Request-ID'] = requestId;
  });
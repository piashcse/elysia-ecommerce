import { AppError, ErrorCodes } from '../../core/errors';
import { logger } from '../logging';

export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export class ErrorHandler {
  /**
   * Handles application errors and logs them appropriately
   */
  static handle(error: Error, context?: string): ErrorInfo {
    // Log the error
    logger.error(`Error in ${context || 'application'}: ${error.message}`, error, {
      context,
      errorType: error.constructor.name,
      stack: error.stack
    });

    // If it's an AppError, return its properties
    if (error instanceof AppError) {
      return {
        code: error.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR,
        message: error.message,
        details: error.details,
        stack: error.stack
      };
    }

    // For other errors, return a generic server error
    return {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      details: { originalMessage: error.message },
      stack: error.stack
    };
  }

  /**
   * Creates a structured error response
   */
  static createErrorResponse(statusCode: number, errorInfo: ErrorInfo) {
    return {
      success: false,
      statusCode,
      message: errorInfo.message,
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
        details: errorInfo.details
      }
    };
  }

  /**
   * Checks if an error is operational (expected) or programming error (unexpected)
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Formats error for logging
   */
  static formatErrorForLog(error: Error, context?: string): any {
    const baseInfo = {
      timestamp: new Date().toISOString(),
      context: context || 'unknown',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    if (error instanceof AppError) {
      return {
        ...baseInfo,
        error: {
          ...baseInfo.error,
          statusCode: error.statusCode,
          errorCode: error.errorCode,
          details: error.details
        }
      };
    }

    return baseInfo;
  }

  /**
   * Handles database errors specifically
   */
  static handleDatabaseError(error: Error, operation: string): ErrorInfo {
    logger.error(`Database error during ${operation}`, error);
    
    // Common database error patterns
    if (error.message.includes('duplicate key')) {
      return {
        code: ErrorCodes.CONFLICT,
        message: 'A duplicate record was detected',
        details: { operation, originalError: error.message }
      };
    }
    
    if (error.message.includes('violates foreign key constraint')) {
      return {
        code: ErrorCodes.BAD_REQUEST,
        message: 'Referenced resource does not exist',
        details: { operation, originalError: error.message }
      };
    }
    
    // Generic database error
    return {
      code: ErrorCodes.DATABASE_ERROR,
      message: 'Database operation failed',
      details: { operation, originalError: error.message }
    };
  }

  /**
   * Handles validation errors specifically
   */
  static handleValidationError(errors: any[], context?: string): ErrorInfo {
    const errorMessages = errors.map((err: any) => 
      err.path ? `${err.path.join('.')}: ${err.message}` : err.message
    ).join(', ');

    logger.warn(`Validation error in ${context || 'request'}`, { errors, context });

    return {
      code: ErrorCodes.VALIDATION_ERROR,
      message: `Validation failed: ${errorMessages}`,
      details: { errors, context }
    };
  }
}

// Export a singleton instance
export const errorHandler = ErrorHandler;
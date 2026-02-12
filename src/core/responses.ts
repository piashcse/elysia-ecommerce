import { t } from 'elysia';

// Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Response formatter functions
export const successResponse = <T>(
  data: T | undefined,
  message: string,
  statusCode: number = 200
): ApiResponse<T> => {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
};

export const errorResponse = (
  message: string,
  code: string,
  statusCode: number,
  details?: any
): ApiResponse => {
  return {
    success: false,
    statusCode,
    message,
    error: {
      code,
      message,
      details,
    },
  };
};

// Pagination response
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    items: T[];
    meta: PaginationMeta;
  };
}

export const paginatedResponse = <T>(
  data: T[],
  paginationMeta: PaginationMeta,
  message: string,
  statusCode: number = 200,
  additionalMeta?: Record<string, any>
): PaginatedResponse<T> => {
  return {
    success: true,
    statusCode,
    message,
    data: {
      items: data,
      meta: { ...paginationMeta, ...additionalMeta },
    },
  };
};

/**
 * Recursively removes sensitive keys from an object
 */
export const sanitizeData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const sensitiveKeys = ['password', 'confirmPassword'];
    const newObj: any = {};
    for (const key in data) {
      if (!sensitiveKeys.includes(key)) {
        newObj[key] = sanitizeData(data[key]);
      }
    }
    return newObj;
  }
  return data;
};

// Common Elysia Schemas for responses
export const successSchema = (dataSchema: any = t.Any()) => t.Object({
  success: t.Boolean(),
  statusCode: t.Number(),
  message: t.String(),
  data: dataSchema
});

export const errorSchema = t.Object({
  success: t.Boolean(),
  statusCode: t.Number(),
  message: t.String(),
  error: t.Object({
    code: t.String(),
    message: t.String(),
    details: t.Optional(t.Any())
  })
});

export const paginatedSchema = (itemSchema: any = t.Any()) => t.Object({
  success: t.Boolean(),
  statusCode: t.Number(),
  message: t.String(),
  data: t.Object({
    items: t.Array(itemSchema),
    meta: t.Object({
      page: t.Number(),
      limit: t.Number(),
      total: t.Number(),
      totalPages: t.Number()
    })
  })
});

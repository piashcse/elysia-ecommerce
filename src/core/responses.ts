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
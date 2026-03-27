/**
 * Application-wide constants
 */

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Rate limiting
export const RATE_LIMIT = {
  AUTH: { points: 5, duration: 60 },      // 5 requests per minute for auth
  DEFAULT: { points: 100, duration: 60 },  // 100 requests per minute for general API
  STRICT: { points: 10, duration: 60 },    // 10 requests per minute for sensitive operations
} as const;

// Password requirements
export const PASSWORD = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 128,
} as const;

// Token expiration
export const TOKEN = {
  JWT_EXPIRY: '24h',
  RESET_PASSWORD_EXPIRY: '1h',
  EMAIL_VERIFICATION_EXPIRY: '24h',
} as const;

// File upload limits
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// Cache TTL (in seconds)
export const CACHE = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Review rating range
export const REVIEW = {
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;

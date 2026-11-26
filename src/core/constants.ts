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
  AUTH: { points: 10, duration: 60 },      // 10 auth requests per minute per IP
  DEFAULT: { points: 100, duration: 60 },  // 100 requests per minute per IP
} as const;

// Password requirements
export const PASSWORD = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
} as const;

// JWT claims
export const JWT_ISSUER = 'elysia-ecommerce';
export const JWT_AUDIENCE = 'elysia-ecommerce-api';

// Token expiration
export const TOKEN = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '30d',
} as const;

// Order status
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

import { Context } from 'elysia';

// Define a type for the JWT payload
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract user information from the request context
 */
export const getCurrentUser = (context: any): JwtPayload | null => {
  if (context.user) {
    return context.user as JwtPayload;
  }
  return null;
};

/**
 * Check if the current user is authenticated
 */
export const isAuthenticated = (context: any): boolean => {
  return !!getCurrentUser(context);
};

/**
 * Check if the current user has admin role
 */
export const isAdmin = (context: any): boolean => {
  const user = getCurrentUser(context);
  return user?.role === 'admin';
};

/**
 * Check if the current user has a specific role
 */
export const hasRole = (context: any, role: string): boolean => {
  const user = getCurrentUser(context);
  return user?.role === role;
};
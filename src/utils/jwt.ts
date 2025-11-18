import { Context } from 'elysia';
import { User } from '../modules/user/entity/User';

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
 * This function assumes that JWT middleware has been applied and user info is available
 */
export const getCurrentUser = (context: Context): Partial<User> | null => {
  // In a real Elysia app with JWT middleware, the user info would be available in context
  // This is a placeholder - actual implementation would depend on how the JWT middleware stores user info
  if (context.jwt) {
    const jwtData = context.jwt;
    return {
      id: jwtData.sub,
      email: jwtData.email,
      role: jwtData.role as any,
    };
  }
  return null;
};

/**
 * Check if the current user is authenticated
 */
export const isAuthenticated = (context: Context): boolean => {
  return !!getCurrentUser(context);
};

/**
 * Check if the current user has admin role
 */
export const isAdmin = (context: Context): boolean => {
  const user = getCurrentUser(context);
  return user?.role === 'admin';
};

/**
 * Check if the current user has a specific role
 */
export const hasRole = (context: Context, role: string): boolean => {
  const user = getCurrentUser(context);
  return user?.role === role;
};
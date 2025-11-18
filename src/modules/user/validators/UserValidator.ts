import { z } from 'zod';
import { UserRole } from '../entity/User';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email('Invalid email format').optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const userRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});
import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(['admin', 'seller', 'customer']).default('customer').optional(),
});

export const loginUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type LoginUserDto = z.infer<typeof loginUserSchema>;

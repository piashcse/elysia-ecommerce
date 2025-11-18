import { z } from 'zod';

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  description: z.string().max(1000).optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const categoryIdSchema = z.object({
  id: z.string().uuid('Invalid category ID format'),
});

export const categoryFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
import { z } from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be a positive number'),
  image: z.string().url('Image must be a valid URL').optional(),
  stock: z.number().int().nonnegative('Stock must be a non-negative integer'),
  isActive: z.boolean().optional(),
  attributes: z.record(z.any()).optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  image: z.string().url().optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  attributes: z.record(z.any()).optional(),
  categoryId: z.string().uuid().optional(),
});

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  inStock: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
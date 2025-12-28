import {z} from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive('Price must be a positive number'),
  imageUrl: z.string().url('Image must be a valid URL').optional(),
  stockQuantity: z.number().int().nonnegative('Stock must be a non-negative integer'),
  sku: z.string().min(1, 'SKU is required').max(100),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  sellerId: z.string().uuid('Seller ID must be a valid UUID'),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  sku: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
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
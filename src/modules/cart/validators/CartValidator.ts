import { z } from 'zod';

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int().positive('Quantity must be a positive integer').max(999),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer').max(999),
});

export const cartIdSchema = z.object({
  id: z.string().uuid('Invalid cart ID format'),
});

export const cartItemIdSchema = z.object({
  id: z.string().uuid('Invalid cart item ID format'),
});

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});
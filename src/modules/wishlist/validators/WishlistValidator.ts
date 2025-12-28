import {z} from 'zod';

// Wishlist validation schemas
export const addToWishlistSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
});

export const wishlistIdSchema = z.object({
  id: z.string().uuid('Invalid wishlist item ID format'),
});

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});
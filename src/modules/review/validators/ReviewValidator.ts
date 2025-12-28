import {z} from 'zod';

export const createReviewSchema = z.object({
    productId: z.string().uuid('Product ID must be a valid UUID'),
    rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
    title: z.string().min(1).max(200).optional(),
    comment: z.string().min(1).max(2000).optional(),
});

export const updateReviewSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(1).max(200).optional(),
    comment: z.string().min(1).max(2000).optional(),
});

export const reviewIdSchema = z.object({
    id: z.string().uuid('Invalid review ID format'),
});

export const markHelpfulSchema = z.object({
    helpful: z.boolean(),
});

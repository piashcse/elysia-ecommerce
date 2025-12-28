import {z} from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive('Discount value must be a positive number'),
  minOrderAmount: z.coerce.number().positive('Minimum order amount must be a positive number').optional(),
  maxDiscountAmount: z.coerce.number().positive('Maximum discount amount must be a positive number').optional(),
  usageLimit: z.number().int().positive('Usage limit must be a positive integer').optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

export const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.coerce.number().positive('Discount value must be a positive number').optional(),
  minOrderAmount: z.coerce.number().positive('Minimum order amount must be a positive number').optional(),
  maxDiscountAmount: z.coerce.number().positive('Maximum discount amount must be a positive number').optional(),
  usageLimit: z.number().int().positive('Usage limit must be a positive integer').optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
});

export const couponIdSchema = z.object({
  id: z.string().uuid('Invalid coupon ID format'),
});

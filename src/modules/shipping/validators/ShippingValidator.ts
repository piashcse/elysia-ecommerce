import { z } from 'zod';

export const createShippingMethodSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  baseCost: z.coerce.number().positive(),
  costPerKg: z.coerce.number().positive().optional(),
  estimatedDaysMin: z.number().int().positive(),
  estimatedDaysMax: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const updateShippingMethodSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  baseCost: z.coerce.number().positive().optional(),
  costPerKg: z.coerce.number().positive().optional(),
  estimatedDaysMin: z.number().int().positive().optional(),
  estimatedDaysMax: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const shippingMethodIdSchema = z.object({
  id: z.string().uuid('Invalid shipping method ID format'),
});

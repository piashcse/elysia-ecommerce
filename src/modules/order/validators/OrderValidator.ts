import { z } from 'zod';
import { OrderStatus } from '../entity/Order';

// Address schema
const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  country: z.string().min(1, 'Country is required').max(100),
});

// Order validation schemas
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('Product ID must be a valid UUID'),
      quantity: z.number().int().positive('Quantity must be a positive integer').max(999),
    })
  ).min(1, 'At least one item is required'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  notes: z.string().max(500).optional(),
});

export const orderIdSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
});

export const orderFilterSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
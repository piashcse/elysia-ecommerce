import { z } from 'zod';

export const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'] as const;
export const paymentStatuses = ['pending', 'completed', 'failed', 'refunded'] as const;

// Payment validation schemas
export const createPaymentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  method: z.enum(paymentMethods),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  metadata: z.record(z.any()).optional(),
});

export const processPaymentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  method: z.enum(paymentMethods),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  paymentDetails: z.object({
    cardNumber: z.string().min(13).max(19).optional(),
    cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Invalid expiry date format (MM/YY)').optional(),
    cardCvv: z.string().min(3).max(4).optional(),
    cardHolderName: z.string().min(1).optional(),
    paypalEmail: z.string().email().optional(),
  })
});

export const updatePaymentSchema = z.object({
  status: z.enum(paymentStatuses),
  transactionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const paymentIdSchema = z.object({
  id: z.string().uuid('Invalid payment ID format'),
});

export const paymentFilterSchema = z.object({
  status: z.enum(paymentStatuses).optional(),
  method: z.enum(paymentMethods).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
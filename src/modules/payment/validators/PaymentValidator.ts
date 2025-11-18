import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '../entity/Payment';

// Payment validation schemas
export const createPaymentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive('Amount must be a positive number'),
  metadata: z.record(z.any()).optional(),
});

export const processPaymentSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive('Amount must be a positive number'),
  paymentDetails: z.object({
    cardNumber: z.string().min(13).max(19).optional(),
    cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Invalid expiry date format (MM/YY)').optional(),
    cardCvv: z.string().min(3).max(4).optional(),
    cardHolderName: z.string().min(1).optional(),
    paypalEmail: z.string().email().optional(),
  }).refine(
    (data) => {
      // If payment method is credit card, require card details
      if (data.cardNumber || data.cardExpiry || data.cardCvv) {
        return data.cardNumber && data.cardExpiry && data.cardCvv;
      }
      // If payment method is PayPal, require email
      if (data.paypalEmail) {
        return true;
      }
      // At least one payment method details must be provided
      return data.cardNumber || data.paypalEmail;
    },
    { message: 'Valid payment details required based on payment method' }
  ),
});

export const updatePaymentSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  transactionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const paymentIdSchema = z.object({
  id: z.string().uuid('Invalid payment ID format'),
});

export const paymentFilterSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
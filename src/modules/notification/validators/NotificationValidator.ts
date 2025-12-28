import {z} from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['order_confirmation', 'order_shipped', 'order_delivered', 'order_cancelled', 'payment_success', 'payment_failed', 'low_stock', 'price_drop', 'promotional', 'system']),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  link: z.string().url().optional(),
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean(),
});

export const notificationIdSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

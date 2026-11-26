import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { notifications } from '../../../database/schema';
import { CreateNotificationDto } from '../dto/NotificationDto';
import { NotFoundError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';

export class NotificationService {
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<any> {
    const [newNotification] = await db.insert(notifications).values(createNotificationDto).returning();
    return newNotification;
  }

  /**
   * Notification creation must never break the primary business flow.
   */
  private async safeCreate(input: CreateNotificationDto): Promise<void> {
    try {
      await this.createNotification(input);
    } catch (error) {
      console.error('Failed to create notification:', (error as Error).message);
    }
  }

  async notifyOrderCreated(userId: string, orderId: string): Promise<void> {
    await this.safeCreate({
      userId,
      type: 'order_confirmation',
      title: 'Order confirmed',
      message: 'Your order has been placed successfully.',
      link: `/orders/${orderId}`,
    });
  }

  async notifyOrderStatus(userId: string, orderId: string, status: string): Promise<void> {
    const mapping: Record<string, { type: CreateNotificationDto['type']; title: string; message: string }> = {
      processing: { type: 'payment_success', title: 'Order processing', message: 'Your order is being prepared.' },
      shipped: { type: 'order_shipped', title: 'Order shipped', message: 'Your order has been shipped.' },
      delivered: { type: 'order_delivered', title: 'Order delivered', message: 'Your order has been delivered.' },
      cancelled: { type: 'order_cancelled', title: 'Order cancelled', message: 'Your order has been cancelled.' },
      refunded: { type: 'payment_refunded', title: 'Order refunded', message: 'Your order has been refunded.' },
    };

    const entry = mapping[status];
    if (!entry) return;

    await this.safeCreate({
      userId,
      type: entry.type,
      title: entry.title,
      message: entry.message,
      link: `/orders/${orderId}`,
    });
  }

  async notifyPaymentCompleted(userId: string, orderId: string): Promise<void> {
    await this.safeCreate({
      userId,
      type: 'payment_success',
      title: 'Payment received',
      message: 'Your payment was completed successfully.',
      link: `/orders/${orderId}`,
    });
  }

  async notifyPaymentFailed(userId: string, orderId: string): Promise<void> {
    await this.safeCreate({
      userId,
      type: 'payment_failed',
      title: 'Payment failed',
      message: 'Your payment could not be completed. Please try again.',
      link: `/orders/${orderId}`,
    });
  }

  async notifyPaymentRefunded(userId: string, orderId: string): Promise<void> {
    await this.safeCreate({
      userId,
      type: 'payment_refunded',
      title: 'Payment refunded',
      message: 'Your payment has been refunded.',
      link: `/orders/${orderId}`,
    });
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<{ notifications: any[]; total: number }> {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit))) : PAGINATION.DEFAULT_LIMIT;
    const offset = (safePage - 1) * safeLimit;

    const [notificationsResult, [countResult]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(safeLimit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
    ]);

    return {
      notifications: notificationsResult,
      total: countResult ? Number(countResult.count) : 0,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(sql`${notifications.userId} = ${userId} AND ${notifications.isRead} = false`);
    return result ? Number(result.count) : 0;
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (!updatedNotification) throw new NotFoundError('Notification not found');
    return updatedNotification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const deleted = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });

    if (!deleted.length) throw new NotFoundError('Notification not found');
  }
}

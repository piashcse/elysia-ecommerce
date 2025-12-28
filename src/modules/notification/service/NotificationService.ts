import {db} from '../../../config/database';
import {notifications} from '../../../database/schema';
import {desc, eq, sql} from 'drizzle-orm';
import {CreateNotificationDto} from '../dto/NotificationDto';
import {NotFoundError} from '../../../core/errors';

export class NotificationService {
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<any> {
    const [newNotification] = await db.insert(notifications).values(createNotificationDto).returning();
    return newNotification;
  }

  async findNotificationById(id: string): Promise<any | null> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return notification || null;
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ notifications: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const notificationsResult = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const total = countResult ? Number(countResult.count) : 0;

    return { notifications: notificationsResult, total };
  }

  async markAsRead(id: string, userId: string): Promise<any> {
    const notification = await this.findNotificationById(id);

    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    const [updatedNotification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();

    return updatedNotification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
  
  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.findNotificationById(id);

    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

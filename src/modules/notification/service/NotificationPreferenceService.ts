import { and, eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { notificationPreferences } from '../../../database/schema';

export class NotificationPreferenceService {
  async list(userId: string) {
    return db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
  }

  async isInAppEnabled(userId: string, type: string) {
    const [record] = await db
      .select({ enabled: notificationPreferences.inAppEnabled })
      .from(notificationPreferences)
      .where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.type, type)))
      .limit(1);
    return record ? record.enabled : true;
  }

  async isEmailEnabled(userId: string, type: string) {
    const [record] = await db
      .select({ enabled: notificationPreferences.emailEnabled })
      .from(notificationPreferences)
      .where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.type, type)))
      .limit(1);
    return record ? record.enabled : true;
  }

  async update(
    userId: string,
    preferences: Array<{ type: string; inAppEnabled?: boolean; emailEnabled?: boolean }>
  ) {
    return db.transaction(async (tx) => {
      const results = [];
      for (const preference of preferences) {
        const [record] = await tx
          .insert(notificationPreferences)
          .values({
            userId,
            type: preference.type,
            inAppEnabled: preference.inAppEnabled ?? true,
            emailEnabled: preference.emailEnabled ?? true,
          })
          .onConflictDoUpdate({
            target: [notificationPreferences.userId, notificationPreferences.type],
            set: {
              ...(preference.inAppEnabled !== undefined ? { inAppEnabled: preference.inAppEnabled } : {}),
              ...(preference.emailEnabled !== undefined ? { emailEnabled: preference.emailEnabled } : {}),
              updatedAt: new Date(),
            },
          })
          .returning();
        results.push(record);
      }
      return results;
    });
  }
}

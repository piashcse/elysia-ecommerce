import { boolean, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  inAppEnabled: boolean('in_app_enabled').default(true).notNull(),
  emailEnabled: boolean('email_enabled').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userTypeUnique: unique('notification_preferences_user_type_unique').on(table.userId, table.type),
}));

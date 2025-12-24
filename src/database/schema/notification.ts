import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './user';

export const notificationTypeEnum = pgEnum('notification_type', [
    'order_confirmation',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'payment_success',
    'payment_failed',
    'low_stock',
    'price_drop',
    'promotional',
    'system'
]);

export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    link: varchar('link', { length: 500 }),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

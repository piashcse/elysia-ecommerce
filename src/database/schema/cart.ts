import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './user';

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('carts_user_idx').on(table.userId),
  userUnique: unique('carts_user_unique').on(table.userId),
}));

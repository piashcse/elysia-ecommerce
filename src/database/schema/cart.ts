import { index, pgTable, timestamp, unique, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './user';

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('carts_user_idx').on(table.userId),
  sessionIdx: index('carts_session_idx').on(table.sessionId),
  userUnique: unique('carts_user_unique').on(table.userId),
  sessionUnique: uniqueIndex('carts_session_unique').on(table.sessionId).where(sql`${table.sessionId} IS NOT NULL`),
}));

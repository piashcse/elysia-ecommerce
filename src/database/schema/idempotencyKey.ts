import { integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';

export const idempotencyKeys = pgTable('idempotency_keys', {
  key: varchar('key', { length: 100 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  scope: varchar('scope', { length: 100 }).notNull(),
  statusCode: integer('status_code').notNull(),
  response: jsonb('response').$type<unknown>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

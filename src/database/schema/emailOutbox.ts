import { index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const emailStatusEnum = pgEnum('email_status', ['pending', 'sent', 'failed']);

export const emailOutbox = pgTable('email_outbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  to: varchar('to', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  text: text('text').notNull(),
  html: text('html'),
  status: emailStatusEnum('status').default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
}, (table) => ({
  statusIdx: index('email_outbox_status_idx').on(table.status, table.createdAt),
}));

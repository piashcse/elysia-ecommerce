import { index, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';

export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'paid', 'cancelled']);

export const sellerPayouts = pgTable('seller_payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').default('pending').notNull(),
  reference: varchar('reference', { length: 100 }),
  notes: text('notes'),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  sellerIdx: index('seller_payouts_seller_idx').on(table.sellerId, table.createdAt),
  statusIdx: index('seller_payouts_status_idx').on(table.status),
}));

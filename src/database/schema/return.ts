import { index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './user';
import { orders } from './order';

export const returnStatusEnum = pgEnum('return_status', [
  'requested',
  'approved',
  'rejected',
  'received',
  'refunded',
  'cancelled',
]);

export const returns = pgTable('returns', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: returnStatusEnum('status').default('requested').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  orderIdx: index('returns_order_idx').on(table.orderId),
  userIdx: index('returns_user_idx').on(table.userId),
  statusIdx: index('returns_status_idx').on(table.status),
}));

export const returnItems = pgTable('return_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  returnId: uuid('return_id').notNull().references(() => returns.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id').notNull(),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  returnIdx: index('return_items_return_idx').on(table.returnId),
}));

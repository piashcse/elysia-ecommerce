import { boolean, index, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';

export const giftCards = pgTable('gift_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  initialBalance: numeric('initial_balance', { precision: 10, scale: 2 }).notNull(),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('gift_cards_code_idx').on(table.code),
}));

export const giftCardTransactions = pgTable('gift_card_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  giftCardId: uuid('gift_card_id').notNull().references(() => giftCards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  orderId: uuid('order_id'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cardIdx: index('gift_card_transactions_card_idx').on(table.giftCardId, table.createdAt),
  orderIdx: index('gift_card_transactions_order_idx').on(table.orderId),
}));

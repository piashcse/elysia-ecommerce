import {numeric, pgEnum, pgTable, timestamp, uuid, varchar} from 'drizzle-orm/pg-core';
import {orders} from './order';

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  method: paymentMethodEnum('method').notNull(),
  transactionId: varchar('transaction_id', { length: 255 }),
  paymentGateway: varchar('payment_gateway', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
import {numeric, pgEnum, pgTable, text, timestamp, uuid, varchar} from 'drizzle-orm/pg-core';
import {users} from './user';

export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  couponCode: varchar('coupon_code', { length: 50 }),
  status: orderStatusEnum('status').default('pending').notNull(),
  shippingAddress: varchar('shipping_address', { length: 500 }).notNull(),
  billingAddress: varchar('billing_address', { length: 500 }).notNull(),
  shippingMethodId: uuid('shipping_method_id'),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
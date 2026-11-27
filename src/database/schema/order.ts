import { check, index, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './user';
import { shippingMethods } from './shipping';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export interface OrderAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 40 }).unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerEmail: varchar('customer_email', { length: 255 }),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }).default('0').notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  couponCode: varchar('coupon_code', { length: 50 }),
  status: orderStatusEnum('status').default('pending').notNull(),
  shippingAddress: jsonb('shipping_address').$type<OrderAddress>().notNull(),
  billingAddress: jsonb('billing_address').$type<OrderAddress>().notNull(),
  shippingMethodId: uuid('shipping_method_id').references(() => shippingMethods.id, { onDelete: 'set null' }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  guestTokenHash: varchar('guest_token_hash', { length: 64 }),
  paymentExpiresAt: timestamp('payment_expires_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('orders_user_idx').on(table.userId),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  amountsNonNegative: check(
    'orders_amounts_non_negative',
    sql`${table.totalAmount} >= 0 AND ${table.subtotal} >= 0 AND ${table.shippingCost} >= 0 AND ${table.taxAmount} >= 0 AND ${table.discountAmount} >= 0`
  ),
}));

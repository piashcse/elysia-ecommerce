import {boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar, index} from 'drizzle-orm/pg-core';
import {users} from './user';
import {orders} from './order';

export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);

export const coupons = pgTable('coupons', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    description: text('description'),
    discountType: discountTypeEnum('discount_type').notNull(),
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
    minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
    maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }),
    usageLimit: integer('usage_limit'), // null = unlimited
    usedCount: integer('used_count').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    codeIdx: index('coupons_code_idx').on(table.code),
    activeIdx: index('coupons_active_idx').on(table.isActive, table.startDate, table.endDate),
}));

export const couponUsage = pgTable('coupon_usage', {
    id: uuid('id').defaultRandom().primaryKey(),
    couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    couponIdx: index('coupon_usage_coupon_idx').on(table.couponId),
    userIdx: index('coupon_usage_user_idx').on(table.userId),
    orderIdx: index('coupon_usage_order_idx').on(table.orderId),
}));

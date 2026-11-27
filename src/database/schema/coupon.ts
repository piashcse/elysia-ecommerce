import { boolean, check, index, integer, numeric, pgEnum, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { products } from './product';
import { categories } from './category';
import { sql } from 'drizzle-orm';
import { users } from './user';
import { orders } from './order';

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
    perUserLimit: integer('per_user_limit').default(1), // null = unlimited per user
    usedCount: integer('used_count').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    stackable: boolean('stackable').default(false).notNull(),
    appliesToShipping: boolean('applies_to_shipping').default(false).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
    codeIdx: index('coupons_code_idx').on(table.code),
    activeIdx: index('coupons_active_idx').on(table.isActive, table.startDate, table.endDate),
    discountPositive: check('coupons_discount_positive', sql`${table.discountValue} > 0`),
    percentageMax: check('coupons_percentage_max', sql`${table.discountType} <> 'percentage' OR ${table.discountValue} <= 100`),
    usedCountNonNegative: check('coupons_used_count_non_negative', sql`${table.usedCount} >= 0`),
    dateRange: check('coupons_date_range', sql`${table.startDate} < ${table.endDate}`),
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
    couponOrderUnique: unique('coupon_usage_coupon_order_unique').on(table.couponId, table.orderId),
}));


export const couponProducts = pgTable('coupon_products', {
    couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
}, (table) => ({
    couponProductUnique: unique('coupon_products_coupon_product_unique').on(table.couponId, table.productId),
}));

export const couponCategories = pgTable('coupon_categories', {
    couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (table) => ({
    couponCategoryUnique: unique('coupon_categories_coupon_category_unique').on(table.couponId, table.categoryId),
}));

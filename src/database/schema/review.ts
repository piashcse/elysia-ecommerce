import { boolean, check, index, integer, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { products } from './product';
import { users } from './user';

export const reviews = pgTable('reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 200 }),
    comment: text('comment'),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
    helpfulCount: integer('helpful_count').default(0).notNull(),
    isApproved: boolean('is_approved').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
    productIdx: index('reviews_product_idx').on(table.productId),
    userIdx: index('reviews_user_idx').on(table.userId),
    ratingIdx: index('reviews_rating_idx').on(table.rating),
    approvedIdx: index('reviews_approved_idx').on(table.isApproved),
    productUserUnique: unique('reviews_product_user_unique').on(table.productId, table.userId),
    ratingRange: check('reviews_rating_range', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
    helpfulNonNegative: check('reviews_helpful_non_negative', sql`${table.helpfulCount} >= 0`),
}));

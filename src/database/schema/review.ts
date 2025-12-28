import {boolean, integer, pgTable, text, timestamp, uuid, varchar} from 'drizzle-orm/pg-core';
import {products} from './product';
import {users} from './user';

export const reviews = pgTable('reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5 stars
    title: varchar('title', { length: 200 }),
    comment: text('comment'),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
    helpfulCount: integer('helpful_count').default(0).notNull(),
    isApproved: boolean('is_approved').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { reviews } from './review';
import { users } from './user';

export const reviewHelpful = pgTable('review_helpful', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  reviewIdx: index('review_helpful_review_idx').on(table.reviewId),
  userIdx: index('review_helpful_user_idx').on(table.userId),
  reviewUserUnique: unique('review_helpful_review_user_unique').on(table.reviewId, table.userId),
}));

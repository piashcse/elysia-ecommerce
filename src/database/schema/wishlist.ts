import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './user';
import { products } from './product';

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('wishlists_user_idx').on(table.userId),
  productIdx: index('wishlists_product_idx').on(table.productId),
  userProductUnique: unique('wishlists_user_product_unique').on(table.userId, table.productId),
}));

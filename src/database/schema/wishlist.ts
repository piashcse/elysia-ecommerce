import {pgTable, timestamp, uuid} from 'drizzle-orm/pg-core';
import {users} from './user';
import {products} from './product';

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
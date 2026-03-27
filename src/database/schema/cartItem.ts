import {integer, pgTable, timestamp, uuid, index} from 'drizzle-orm/pg-core';
import {carts} from './cart';
import {products} from './product';

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartIdx: index('cart_items_cart_idx').on(table.cartId),
  productIdx: index('cart_items_product_idx').on(table.productId),
}));
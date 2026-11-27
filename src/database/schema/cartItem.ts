import { check, index, integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { carts } from './cart';
import { products } from './product';
import { productVariants } from './productVariant';

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  cartIdx: index('cart_items_cart_idx').on(table.cartId),
  productIdx: index('cart_items_product_idx').on(table.productId),
  cartProductUnique: unique('cart_items_cart_product_unique').on(table.cartId, table.productId, table.variantId),
  quantityPositive: check('cart_items_quantity_positive', sql`${table.quantity} > 0`),
}));

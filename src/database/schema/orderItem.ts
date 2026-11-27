import { check, index, integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orders } from './order';
import { products } from './product';
import { productVariants } from './productVariant';
import { users } from './user';

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  // Keep historical order lines even if the product is later removed.
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  sellerId: uuid('seller_id').references(() => users.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantName: varchar('variant_name', { length: 200 }),
  productSku: varchar('product_sku', { length: 100 }).notNull(),
  productImageUrl: varchar('product_image_url', { length: 500 }),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('order_items_order_idx').on(table.orderId),
  productIdx: index('order_items_product_idx').on(table.productId),
  sellerIdx: index('order_items_seller_idx').on(table.sellerId),
  quantityPositive: check('order_items_quantity_positive', sql`${table.quantity} > 0`),
  priceNonNegative: check('order_items_price_non_negative', sql`${table.price} >= 0`),
}));

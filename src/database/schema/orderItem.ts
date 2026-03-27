import {integer, numeric, pgTable, timestamp, uuid, index} from 'drizzle-orm/pg-core';
import {orders} from './order';
import {products} from './product';

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('order_items_order_idx').on(table.orderId),
  productIdx: index('order_items_product_idx').on(table.productId),
}));
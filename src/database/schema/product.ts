import {boolean, integer, numeric, pgTable, text, timestamp, uuid, varchar} from 'drizzle-orm/pg-core';
import {categories} from './category';
import {users} from './user';
import { index } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  sellerId: uuid('seller_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('products_category_idx').on(table.categoryId),
  sellerIdx: index('products_seller_idx').on(table.sellerId),
  activeIdx: index('products_active_idx').on(table.isActive),
}));
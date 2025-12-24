import { pgTable, uuid, varchar, text, numeric, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { categories } from './category';
import { users } from './user';

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
  sellerId: uuid('seller_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
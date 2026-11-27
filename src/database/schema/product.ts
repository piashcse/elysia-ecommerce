import { boolean, check, index, integer, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { categories } from './category';
import { users } from './user';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  weightGrams: integer('weight_grams').default(0).notNull(),
  taxClass: varchar('tax_class', { length: 50 }).default('standard').notNull(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  // Products are retained if a seller account is removed; the seller association
  // is cleared instead of cascading into order history.
  sellerId: uuid('seller_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  categoryIdx: index('products_category_idx').on(table.categoryId),
  sellerIdx: index('products_seller_idx').on(table.sellerId),
  activeIdx: index('products_active_idx').on(table.isActive),
  priceNonNegative: check('products_price_non_negative', sql`${table.price} >= 0`),
  stockNonNegative: check('products_stock_non_negative', sql`${table.stockQuantity} >= 0`),
  weightNonNegative: check('products_weight_non_negative', sql`${table.weightGrams} >= 0`),
}));

import { index, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { products } from './product';
import { categories } from './category';

export const productTranslations = pgTable('product_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  locale: varchar('locale', { length: 10 }).notNull(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  metaTitle: varchar('meta_title', { length: 200 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  productLocaleUnique: unique('product_translations_product_locale_unique').on(table.productId, table.locale),
  productIdx: index('product_translations_product_idx').on(table.productId),
}));

export const categoryTranslations = pgTable('category_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  locale: varchar('locale', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }),
  description: text('description'),
  metaTitle: varchar('meta_title', { length: 200 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  categoryLocaleUnique: unique('category_translations_category_locale_unique').on(table.categoryId, table.locale),
  categoryIdx: index('category_translations_category_idx').on(table.categoryId),
}));

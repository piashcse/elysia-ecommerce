import { pgTable, uuid, varchar, numeric, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { products } from './product';

export const productVariants = pgTable('product_variants', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 200 }).notNull(), // e.g., "Red - Large"
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    imageUrl: varchar('image_url', { length: 500 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const variantAttributes = pgTable('variant_attributes', {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
    attributeName: varchar('attribute_name', { length: 100 }).notNull(), // e.g., "Color", "Size"
    attributeValue: varchar('attribute_value', { length: 100 }).notNull(), // e.g., "Red", "Large"
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

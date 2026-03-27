import {boolean, integer, numeric, pgTable, timestamp, uuid, varchar, index} from 'drizzle-orm/pg-core';
import {products} from './product';

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
}, (table) => ({
    productIdx: index('product_variants_product_idx').on(table.productId),
    skuIdx: index('product_variants_sku_idx').on(table.sku),
    activeIdx: index('product_variants_active_idx').on(table.isActive),
}));

export const variantAttributes = pgTable('variant_attributes', {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
    attributeName: varchar('attribute_name', { length: 100 }).notNull(), // e.g., "Color", "Size"
    attributeValue: varchar('attribute_value', { length: 100 }).notNull(), // e.g., "Red", "Large"
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    variantIdx: index('variant_attributes_variant_idx').on(table.variantId),
    nameIdx: index('variant_attributes_name_idx').on(table.attributeName),
}));

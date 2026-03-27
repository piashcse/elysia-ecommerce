import {boolean, integer, pgTable, timestamp, uuid, varchar, index} from 'drizzle-orm/pg-core';
import {products} from './product';

export const productImages = pgTable('product_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    imageUrl: varchar('image_url', { length: 500 }).notNull(),
    altText: varchar('alt_text', { length: 255 }),
    displayOrder: integer('display_order').default(0).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    productIdx: index('product_images_product_idx').on(table.productId),
    primaryIdx: index('product_images_primary_idx').on(table.productId, table.isPrimary),
}));

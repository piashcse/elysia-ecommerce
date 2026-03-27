import {boolean, integer, numeric, pgTable, text, timestamp, uuid, varchar, index} from 'drizzle-orm/pg-core';

export const shippingMethods = pgTable('shipping_methods', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    baseCost: numeric('base_cost', { precision: 10, scale: 2 }).notNull(),
    costPerKg: numeric('cost_per_kg', { precision: 10, scale: 2 }),
    estimatedDaysMin: integer('estimated_days_min').notNull(),
    estimatedDaysMax: integer('estimated_days_max').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    nameIdx: index('shipping_methods_name_idx').on(table.name),
    activeIdx: index('shipping_methods_active_idx').on(table.isActive),
}));

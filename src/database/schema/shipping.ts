import { boolean, check, index, integer, jsonb, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const shippingMethods = pgTable('shipping_methods', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    baseCost: numeric('base_cost', { precision: 10, scale: 2 }).notNull(),
    costPerKg: numeric('cost_per_kg', { precision: 10, scale: 2 }),
    estimatedDaysMin: integer('estimated_days_min').notNull(),
    estimatedDaysMax: integer('estimated_days_max').notNull(),
    countries: jsonb('countries').$type<string[]>().default([]).notNull(),
    freeShippingThreshold: numeric('free_shipping_threshold', { precision: 10, scale: 2 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
    nameIdx: index('shipping_methods_name_idx').on(table.name),
    activeIdx: index('shipping_methods_active_idx').on(table.isActive),
    costNonNegative: check('shipping_methods_cost_non_negative', sql`${table.baseCost} >= 0 AND (${table.costPerKg} IS NULL OR ${table.costPerKg} >= 0)`),
    daysRange: check('shipping_methods_days_range', sql`${table.estimatedDaysMin} >= 0 AND ${table.estimatedDaysMax} >= ${table.estimatedDaysMin}`),
}));

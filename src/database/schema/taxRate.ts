import { boolean, index, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const taxRates = pgTable('tax_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  region: varchar('region', { length: 100 }),
  rate: numeric('rate', { precision: 5, scale: 4 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  countryIdx: index('tax_rates_country_idx').on(table.country, table.region),
  activeIdx: index('tax_rates_active_idx').on(table.isActive),
}));

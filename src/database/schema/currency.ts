import { boolean, index, numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

// Rates are expressed as: 1 unit of the base currency (USD) = `rate` units of
// this currency. USD itself always has a rate of 1.
export const currencies = pgTable('currencies', {
  code: varchar('code', { length: 3 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).default('1').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  activeIdx: index('currencies_active_idx').on(table.isActive),
}));

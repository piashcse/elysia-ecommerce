import { boolean, index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';

export const savedPaymentMethods = pgTable('saved_payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  brand: varchar('brand', { length: 50 }),
  last4: varchar('last4', { length: 4 }),
  expMonth: integer('exp_month'),
  expYear: integer('exp_year'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('saved_payment_methods_user_idx').on(table.userId),
}));

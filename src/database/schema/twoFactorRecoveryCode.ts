import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';

export const twoFactorRecoveryCodes = pgTable('two_factor_recovery_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeHash: varchar('code_hash', { length: 64 }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('two_factor_recovery_codes_user_idx').on(table.userId),
  hashIdx: index('two_factor_recovery_codes_hash_idx').on(table.codeHash),
}));

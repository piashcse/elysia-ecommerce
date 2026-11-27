import { boolean, check, integer, numeric, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { UserRole } from '../../core/roles';

export const userRoleEnum = pgEnum('user_role', [UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum('role').default(UserRole.CUSTOMER).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  twoFactorSecret: varchar('two_factor_secret', { length: 64 }),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  emailVerificationToken: varchar('email_verification_token', { length: 64 }),
  emailVerificationExpires: timestamp('email_verification_expires', { withTimezone: true }),
  passwordResetToken: varchar('password_reset_token', { length: 64 }),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  tokenVersion: integer('token_version').default(0).notNull(),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 }).default('0.1').notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  tokenVersionNonNegative: check('users_token_version_non_negative', sql`${table.tokenVersion} >= 0`),
}));

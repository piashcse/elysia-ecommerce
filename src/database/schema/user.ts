import {boolean, pgEnum, pgTable, timestamp, uuid, varchar} from 'drizzle-orm/pg-core';
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

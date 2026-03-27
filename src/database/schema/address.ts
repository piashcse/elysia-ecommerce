import {boolean, pgEnum, pgTable, timestamp, uuid, varchar, index} from 'drizzle-orm/pg-core';
import {users} from './user';

export const addressTypeEnum = pgEnum('address_type', ['shipping', 'billing', 'both']);

export const addresses = pgTable('addresses', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: addressTypeEnum('type').notNull(),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index('addresses_user_idx').on(table.userId),
    userDefaultIdx: index('addresses_user_default_idx').on(table.userId, table.isDefault),
}));

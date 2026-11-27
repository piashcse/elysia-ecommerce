import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const searchSynonyms = pgTable('search_synonyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  term: varchar('term', { length: 100 }).notNull().unique(),
  synonyms: jsonb('synonyms').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

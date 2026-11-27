import { eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { searchSynonyms } from '../../../database/schema';
import { NotFoundError } from '../../../core/errors';

const normalize = (value: string) => value.trim().toLowerCase();

export class SearchService {
  async listSynonyms() {
    return db.select().from(searchSynonyms).orderBy(searchSynonyms.term);
  }

  async upsertSynonym(term: string, synonyms: string[]) {
    const normalizedTerm = normalize(term);
    const normalizedSynonyms = [...new Set(synonyms.map(normalize).filter((value) => value && value !== normalizedTerm))];

    const [record] = await db
      .insert(searchSynonyms)
      .values({ term: normalizedTerm, synonyms: normalizedSynonyms })
      .onConflictDoUpdate({
        target: searchSynonyms.term,
        set: { synonyms: normalizedSynonyms },
      })
      .returning();

    return record;
  }

  async deleteSynonym(id: string) {
    const [record] = await db.delete(searchSynonyms).where(eq(searchSynonyms.id, id)).returning();
    if (!record) throw new NotFoundError('Search synonym not found');
    return record;
  }

  /**
   * Expands a free-text query with configured synonyms. The original tokens are
   * always kept so exact matches are never lost.
   */
  async expand(query: string): Promise<string[]> {
    const normalized = normalize(query);
    if (!normalized) return [];

    const rows = await db.select().from(searchSynonyms);
    const terms = new Set<string>([normalized]);

    for (const row of rows) {
      const rowTerm = normalize(row.term);
      const rowSynonyms = (row.synonyms ?? []).map(normalize);
      const matches = normalized.includes(rowTerm)
        || rowSynonyms.some((synonym) => synonym && normalized.includes(synonym));
      if (!matches) continue;

      terms.add(rowTerm);
      rowSynonyms.forEach((synonym) => terms.add(synonym));
    }

    return [...terms].filter(Boolean);
  }
}

export const searchService = new SearchService();

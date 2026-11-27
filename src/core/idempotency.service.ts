import { and, eq } from 'drizzle-orm';
import { db } from '../config/database';
import { idempotencyKeys } from '../database/schema';

export class IdempotencyService {
  async get(key: string, scope: string) {
    const [record] = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.scope, scope)))
      .limit(1);

    return record ?? null;
  }

  async save(
    key: string,
    scope: string,
    statusCode: number,
    response: unknown,
    userId?: string | null
  ) {
    const [record] = await db
      .insert(idempotencyKeys)
      .values({ key, scope, statusCode, response, userId: userId ?? null })
      .onConflictDoNothing()
      .returning();

    return record ?? this.get(key, scope);
  }
}

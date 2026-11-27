import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { apiKeys, users } from '../../../database/schema';
import { NotFoundError } from '../../../core/errors';
import { sha256Hash } from '../../../utils/auth';

export class ApiKeyService {
  async create(userId: string, name: string, scopes: string[] = []) {
    const raw = `esk_${crypto.randomUUID().replaceAll('-', '')}`;
    const [record] = await db.insert(apiKeys).values({
      userId,
      name,
      keyHash: sha256Hash(raw),
      scopes,
    }).returning();
    return { ...record, key: raw };
  }

  async list(userId: string) {
    return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(apiKeys.createdAt);
  }

  async revoke(userId: string, id: string) {
    const [record] = await db.update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();
    if (!record) throw new NotFoundError('API key not found');
    return record;
  }

  async resolve(raw: string) {
    const hash = sha256Hash(raw);
    const [row] = await db
      .select({
        user: {
          id: users.id,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          tokenVersion: users.tokenVersion,
          deletedAt: users.deletedAt,
        },
        keyId: apiKeys.id,
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(and(
        eq(apiKeys.keyHash, hash),
        eq(apiKeys.isActive, true),
        or(isNull(apiKeys.expiresAt), sql`${apiKeys.expiresAt} > now()`)
      ))
      .limit(1);

    if (!row || !row.user.isActive || row.user.deletedAt) return null;
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.keyId));
    return row.user;
  }
}

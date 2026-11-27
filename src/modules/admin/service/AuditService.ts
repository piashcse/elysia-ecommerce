import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { auditLogs } from '../../../database/schema';
import { PAGINATION } from '../../../core/constants';

export class AuditService {
  log(input: {
    userId?: string | null;
    method: string;
    path: string;
    status?: number | string;
    ip?: string;
    metadata?: Record<string, unknown>;
  }) {
    return db.insert(auditLogs).values({
      userId: input.userId ?? null,
      method: input.method,
      path: input.path,
      status: input.status ? String(input.status) : null,
      ip: input.ip,
      metadata: input.metadata,
    });
  }

  async list(page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT, filters: { userId?: string; path?: string } = {}) {
    const conditions = [];
    if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));
    if (filters.path) conditions.push(sql`${auditLogs.path} ILIKE ${'%' + filters.path + '%'}`);
    const where = conditions.length ? and(...conditions) : undefined;
    const safeLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));

    const [items, [count]] = await Promise.all([
      db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(safeLimit).offset((Math.max(1, page) - 1) * safeLimit),
      db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
    ]);

    return { items, total: count ? Number(count.count) : 0 };
  }
}

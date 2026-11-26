import { db } from '../config/database';
import { eq, sql, desc, and } from 'drizzle-orm';
import { NotFoundError, ValidationError } from './errors';
import { isUuid } from '../utils/validation';
import { PAGINATION } from './constants';

export class BaseService<T extends any> {
    constructor(protected schema: any) { }

    async findAll(
        page: number = 1,
        limit: number = 10,
        conditions: any[] = [],
        orderByClause?: any
    ): Promise<{ items: any[]; total: number }> {
        const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : PAGINATION.DEFAULT_PAGE;
        const safeLimit = Number.isFinite(limit)
            ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit)))
            : PAGINATION.DEFAULT_LIMIT;
        const offset = (safePage - 1) * safeLimit;
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const items = await db
            .select()
            .from(this.schema)
            .where(whereClause)
            .limit(safeLimit)
            .offset(offset)
            .orderBy(orderByClause ?? desc((this.schema as any).createdAt));

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(this.schema)
            .where(whereClause);

        const total = countResult ? Number(countResult.count) : 0;

        return { items, total };
    }

    async findById(id: string): Promise<any> {
        if (!isUuid(id)) {
            throw new ValidationError('Invalid resource ID format');
        }

        const [item] = await db.select().from(this.schema).where(eq((this.schema as any).id, id)).limit(1);
        return item || null;
    }

    async findByIdOrFail(id: string, resourceName: string = 'Resource'): Promise<any> {
        const item = await this.findById(id);
        if (!item) {
            throw new NotFoundError(`${resourceName} not found`);
        }
        return item;
    }

    async create(data: any): Promise<any> {
        const [newItem] = (await db.insert(this.schema).values(data).returning()) as any[];
        return newItem;
    }

    async update(id: string, data: any): Promise<any> {
        await this.findByIdOrFail(id);

        const updateData = { ...data };
        if ((this.schema as any).updatedAt) {
            updateData.updatedAt = new Date();
        }

        const [updatedItem] = (await db
            .update(this.schema)
            .set(updateData)
            .where(eq((this.schema as any).id, id))
            .returning()) as any[];
        return updatedItem;
    }

    async delete(id: string): Promise<void> {
        await this.findByIdOrFail(id);
        await db.delete(this.schema).where(eq((this.schema as any).id, id));
    }
}

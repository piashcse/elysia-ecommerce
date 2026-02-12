import { db } from '../config/database';
import { eq, sql, desc, and } from 'drizzle-orm';
import { NotFoundError } from './errors';

export class BaseService<T extends any> {
    constructor(protected schema: any) { }

    async findAll(page: number = 1, limit: number = 10, conditions: any[] = []): Promise<{ items: any[]; total: number }> {
        const offset = (page - 1) * limit;
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const items = await db
            .select()
            .from(this.schema)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc((this.schema as any).createdAt));

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(this.schema)
            .where(whereClause);

        const total = countResult ? Number(countResult.count) : 0;

        return { items, total };
    }

    async findById(id: string): Promise<any> {
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
        const [updatedItem] = (await db
            .update(this.schema)
            .set(data)
            .where(eq((this.schema as any).id, id))
            .returning()) as any[];
        return updatedItem;
    }

    async delete(id: string): Promise<void> {
        await this.findByIdOrFail(id);
        await db.delete(this.schema).where(eq((this.schema as any).id, id));
    }
}

import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { taxRates } from '../../../database/schema';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';

export interface TaxInput {
  name: string;
  country: string;
  region?: string;
  rate: number;
  isActive?: boolean;
}

export class TaxService {
  async getRate(country?: string, region?: string) {
    if (!country) return { rate: 0, name: 'No tax' };

    const conditions = [eq(taxRates.isActive, true), ilike(taxRates.country, country)];
    if (region) {
      conditions.push(or(isNull(taxRates.region), ilike(taxRates.region, region))!);
    } else {
      conditions.push(isNull(taxRates.region));
    }

    const [record] = await db
      .select()
      .from(taxRates)
      .where(and(...conditions))
      .orderBy(sql`${taxRates.region} NULLS LAST`)
      .limit(1);

    return record
      ? { rate: Number(record.rate), name: record.name }
      : { rate: 0, name: 'No tax' };
  }

  async calculate(taxableCents: number, country?: string, region?: string) {
    const tax = await this.getRate(country, region);
    return {
      rate: tax.rate,
      name: tax.name,
      taxCents: Math.round(taxableCents * tax.rate),
    };
  }

  async list(page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
    const safePage = Math.max(1, Math.trunc(page));
    const safeLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit)));
    const offset = (safePage - 1) * safeLimit;

    const [items, [count]] = await Promise.all([
      db.select().from(taxRates).orderBy(taxRates.country, taxRates.region).limit(safeLimit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(taxRates),
    ]);

    return { items, total: count ? Number(count.count) : 0 };
  }

  async create(input: TaxInput) {
    if (!input.name.trim() || !input.country.trim()) throw new ValidationError('Tax name and country are required');
    if (input.rate < 0 || input.rate > 1) throw new ValidationError('Tax rate must be between 0 and 1');

    const [existing] = await db
      .select({ id: taxRates.id })
      .from(taxRates)
      .where(and(ilike(taxRates.country, input.country), input.region ? ilike(taxRates.region, input.region) : isNull(taxRates.region)))
      .limit(1);
    if (existing) throw new ConflictError('A tax rate already exists for this region', 'TAX_RATE_EXISTS');

    const [record] = await db
      .insert(taxRates)
      .values({ ...input, rate: input.rate.toString() })
      .returning();
    return record;
  }

  async update(id: string, input: Partial<TaxInput>) {
    const updateData: any = { ...input, updatedAt: new Date() };
    if (input.rate !== undefined) updateData.rate = input.rate.toString();

    const [record] = await db.update(taxRates)
      .set(updateData)
      .where(eq(taxRates.id, id))
      .returning();
    if (!record) throw new NotFoundError('Tax rate not found');
    return record;
  }

  async delete(id: string) {
    const deleted = await db.delete(taxRates).where(eq(taxRates.id, id)).returning({ id: taxRates.id });
    if (!deleted.length) throw new NotFoundError('Tax rate not found');
  }
}

export const taxService = new TaxService();


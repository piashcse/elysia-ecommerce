import { eq, ilike } from 'drizzle-orm';
import { db } from '../../../config/database';
import { brands } from '../../../database/schema';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || `item-${Date.now()}`;

export class BrandService extends BaseService {
  constructor() {
    super(brands);
  }

  async createBrand(input: { name: string; description?: string; logoUrl?: string; isActive?: boolean }): Promise<any> {
    const slug = slugify(input.name);
    const [existing] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, slug)).limit(1);
    if (existing) throw new ConflictError('Brand with this name already exists', 'BRAND_EXISTS');
    const [record] = await db.insert(brands).values({ ...input, slug }).returning();
    return record;
  }

  async updateBrand(id: string, input: { name?: string; description?: string; logoUrl?: string; isActive?: boolean }): Promise<any> {
    await this.findByIdOrFail(id, 'Brand');
    const data: any = { ...input };
    if (input.name) data.slug = slugify(input.name);
    const [updated] = await db.update(brands).set(data).where(eq(brands.id, id)).returning();
    return updated;
  }

  async list(page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT, filters: { search?: string; isActive?: boolean } = {}) {
    const conditions = [];
    if (filters.search) conditions.push(ilike(brands.name, `%${filters.search}%`));
    if (filters.isActive !== undefined) conditions.push(eq(brands.isActive, filters.isActive));
    return this.findAll(page, limit, conditions);
  }

  async getBySlug(slug: string) {
    const [brand] = await db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
    if (!brand) throw new NotFoundError('Brand not found');
    return brand;
  }

  async get(id: string) {
    return this.findByIdOrFail(id, 'Brand');
  }

  async deleteBrand(id: string) {
    const deleted = await db.delete(brands).where(eq(brands.id, id)).returning({ id: brands.id });
    if (!deleted.length) throw new NotFoundError('Brand not found');
  }
}

import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { categories, products } from '../../../database/schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/CategoryDto';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';

export class CategoryService extends BaseService {
  constructor() {
    super(categories);
  }

  async createCategory(createCategoryDto: CreateCategoryDto & { imageUrl?: string; isActive?: boolean }): Promise<any> {
    const [existingCategory] = await db.select().from(categories).where(eq(categories.name, createCategoryDto.name)).limit(1);
    if (existingCategory) throw new ConflictError('Category with this name already exists');
    return this.create(createCategoryDto);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto & { imageUrl?: string; isActive?: boolean }): Promise<any> {
    const category = await this.findByIdOrFail(id, 'Category');

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const [existingCategory] = await db.select().from(categories).where(eq(categories.name, updateCategoryDto.name)).limit(1);
      if (existingCategory) throw new ConflictError('Category with this name already exists');
    }

    const [updated] = await db
      .update(categories)
      .set({ ...updateCategoryDto, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.findByIdOrFail(id, 'Category');

    const [associatedProduct] = await db.select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
    if (associatedProduct) {
      throw new ConflictError('Cannot delete a category that still has products', 'CATEGORY_HAS_PRODUCTS');
    }

    await db.delete(categories).where(eq(categories.id, id));
  }

  async getAllCategories(
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: {
      search?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(
        ilike(categories.name, term),
        ilike(categories.description, term)
      ));
    }
    if (filters.isActive !== undefined) conditions.push(eq(categories.isActive, filters.isActive));

    return this.findAll(page, limit, conditions);
  }

  async getCategoryWithProducts(
    id: string,
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: { isActive?: boolean } = {}
  ): Promise<any> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!category) throw new NotFoundError('Category not found');

    const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit))) : PAGINATION.DEFAULT_LIMIT;
    const offset = (safePage - 1) * safeLimit;

    const conditions = [eq(products.categoryId, id)];
    if (filters.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));
    const whereClause = and(...conditions);

    const [productsResult, [countResult]] = await Promise.all([
      db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(products.createdAt)
        .limit(safeLimit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause),
    ]);

    const total = countResult ? Number(countResult.count) : 0;

    return {
      category,
      products: productsResult,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      }
    };
  }
}

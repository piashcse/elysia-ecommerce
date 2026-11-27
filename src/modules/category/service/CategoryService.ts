import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { categories, products } from '../../../database/schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/CategoryDto';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';
import { slugify } from '../../brand/service/BrandService';
import { translationService } from '../../translation/service/TranslationService';

export class CategoryService extends BaseService {
  constructor() {
    super(categories);
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<any> {
    const [existingCategory] = await db.select().from(categories).where(eq(categories.name, createCategoryDto.name)).limit(1);
    if (existingCategory) throw new ConflictError('Category with this name already exists');
    if (createCategoryDto.parentId) await this.findByIdOrFail(createCategoryDto.parentId, 'Parent category');
    return this.create({ ...createCategoryDto, slug: createCategoryDto.slug ?? slugify(createCategoryDto.name) });
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<any> {
    const category = await this.findByIdOrFail(id, 'Category');
    if (updateCategoryDto.parentId === id) throw new ConflictError('A category cannot be its own parent');
    if (updateCategoryDto.parentId) await this.findByIdOrFail(updateCategoryDto.parentId, 'Parent category');

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const [existingCategory] = await db.select().from(categories).where(eq(categories.name, updateCategoryDto.name)).limit(1);
      if (existingCategory) throw new ConflictError('Category with this name already exists');
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...updateCategoryDto,
        ...(updateCategoryDto.name && !updateCategoryDto.slug ? { slug: slugify(updateCategoryDto.name) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return updated;
  }

  async getById(id: string, locale?: string) {
    const category = await this.findByIdOrFail(id, 'Category');
    return translationService.applyCategory(category, locale);
  }

  async getBySlug(slug: string, locale?: string) {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    if (!category) throw new NotFoundError('Category not found');
    return translationService.applyCategory(category, locale);
  }

  async getTree(locale?: string) {
    const rows = await db.select().from(categories).orderBy(categories.name);
    const byParent = new Map<string | null, any[]>();
    for (const row of rows) {
      const key = row.parentId ?? null;
      byParent.set(key, [...(byParent.get(key) ?? []), { ...row, children: [] }]);
    }
    const attach = (parentId: string | null): any[] =>
      (byParent.get(parentId) ?? []).map((category) => ({
        ...category,
        children: attach(category.id),
      }));
    return translationService.applyCategoryTree(attach(null), locale);
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
      locale?: string;
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

    const result = await this.findAll(page, limit, conditions);
    return {
      ...result,
      items: await translationService.applyCategories(result.items, filters.locale),
    };
  }

  async getCategoryWithProducts(
    id: string,
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: { isActive?: boolean; locale?: string } = {}
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
      category: await translationService.applyCategory(category, filters.locale),
      products: await translationService.applyProducts(productsResult, filters.locale),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      }
    };
  }
}

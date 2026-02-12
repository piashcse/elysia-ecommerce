import { db } from '../../../config/database';
import { categories, products } from '../../../database/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/CategoryDto';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class CategoryService extends BaseService<typeof categories> {
  constructor() {
    super(categories);
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<any> {
    const [existingCategory] = await db.select().from(categories).where(eq(categories.name, createCategoryDto.name)).limit(1);

    if (existingCategory) {
      throw new ConflictError('Category with this name already exists');
    }

    return this.create(createCategoryDto);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<any> {
    const category = await this.findByIdOrFail(id, 'Category');

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const [existingCategory] = await db.select().from(categories).where(eq(categories.name, updateCategoryDto.name)).limit(1);
      if (existingCategory) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    return this.update(id, updateCategoryDto);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.findByIdOrFail(id, 'Category');

    const [associatedProduct] = await db.select().from(products).where(eq(products.categoryId, id)).limit(1);
    if (associatedProduct) {
      throw new Error('Cannot delete category with associated products');
    }

    return this.delete(id);
  }

  async getAllCategories(
    page: number = 1,
    limit: number = 10,
    filters: {
      search?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];

    if (filters.search) {
      conditions.push(
        or(
          ilike(categories.name, `%${filters.search}%`),
          ilike(categories.description, `%${filters.search}%`)
        )
      );
    }

    return this.findAll(page, limit, conditions);
  }

  async getCategoryWithProducts(id: string, page: number = 1, limit: number = 10): Promise<any> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const offset = (page - 1) * limit;

    const productsResult = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, id))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, id));

    const total = countResult ? Number(countResult.count) : 0;

    return {
      category,
      products: productsResult,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
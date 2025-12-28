import {db} from '../../../config/database';
import {categories, products} from '../../../database/schema';
import {and, desc, eq, ilike, or, sql} from 'drizzle-orm';
import {CreateCategoryDto, UpdateCategoryDto} from '../dto/CategoryDto';
import {ConflictError, NotFoundError} from '../../../core/errors';

export class CategoryService {
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<any> {
    const existingCategory = await db.select().from(categories).where(eq(categories.name, createCategoryDto.name)).limit(1);

    if (existingCategory.length > 0) {
      throw new ConflictError('Category with this name already exists');
    }

    const [newCategory] = await db.insert(categories).values({
      name: createCategoryDto.name,
      description: createCategoryDto.description,
    }).returning();

    return newCategory;
  }

  async findCategoryById(id: string): Promise<any | null> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return category || null;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<any> {
    const category = await this.findCategoryById(id);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await db.select().from(categories).where(eq(categories.name, updateCategoryDto.name)).limit(1);
      if (existingCategory.length > 0) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    const [updatedCategory] = await db.update(categories)
      .set(updateCategoryDto)
      .where(eq(categories.id, id))
      .returning();

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.findCategoryById(id);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const productsResult = await db.select().from(products).where(eq(products.categoryId, id)).limit(1);
    if (productsResult.length > 0) {
      throw new Error('Cannot delete category with associated products');
    }

    await db.delete(categories).where(eq(categories.id, id));
  }

  async getAllCategories(
    page: number = 1,
    limit: number = 10,
    filters: {
      search?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{ categories: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.search) {
      conditions.push(
        or(
          ilike(categories.name, `%${filters.search}%`),
          ilike(categories.description, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const categoriesResult = await db.select().from(categories)
      .where(whereClause)
      .orderBy(desc(categories.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(categories).where(whereClause);
    const total = countResult ? Number(countResult.count) : 0;

    return { categories: categoriesResult, total };
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
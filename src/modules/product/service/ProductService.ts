import { db } from '../../../config/database';
import { categories, products } from '../../../database/schema';
import { and, desc, eq, gt, gte, ilike, lte, sql } from 'drizzle-orm';
import { CreateProductDto, UpdateProductDto } from '../dto/ProductDto';
import { NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class ProductService extends BaseService<typeof products> {
  constructor() {
    super(products);
  }

  async createProduct(createProductDto: CreateProductDto): Promise<any> {
    if (createProductDto.categoryId) {
      const [category] = await db.select().from(categories).where(eq(categories.id, createProductDto.categoryId)).limit(1);
      if (!category) throw new NotFoundError('Category not found');
    }

    return this.create({
      ...createProductDto,
      price: createProductDto.price.toString(),
      isActive: createProductDto.isActive ?? true,
    });
  }

  async findProductByIdWithDetails(id: string): Promise<any> {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        stockQuantity: products.stockQuantity,
        isActive: products.isActive,
        categoryId: products.categoryId,
        sku: products.sku,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    return product || null;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<any> {
    const product = await this.findByIdOrFail(id, 'Product');

    if (updateProductDto.categoryId) {
      const [category] = await db.select().from(categories).where(eq(categories.id, updateProductDto.categoryId)).limit(1);
      if (!category) throw new NotFoundError('Category not found');
    }

    const updateData: any = { ...updateProductDto };
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price.toString();
    }

    return this.update(id, updateData);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.delete(id);
  }

  async getAllProducts(
    page: number = 1,
    limit: number = 10,
    filters: {
      search?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      isActive?: boolean;
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];

    if (filters.search) conditions.push(ilike(products.name, `%${filters.search}%`));
    if (filters.category) conditions.push(eq(products.categoryId, filters.category));
    if (filters.minPrice !== undefined) conditions.push(gte(products.price, filters.minPrice.toString()));
    if (filters.maxPrice !== undefined) conditions.push(lte(products.price, filters.maxPrice.toString()));
    if (filters.inStock) conditions.push(gt(products.stockQuantity, 0));
    if (filters.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));

    return this.findAll(page, limit, conditions);
  }

  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: any[]; total: number }> {
    return this.findAll(page, limit, [eq(products.categoryId, categoryId)]);
  }

  async updateProductStock(productId: string, quantity: number): Promise<any> {
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const newStock = Number(product.stockQuantity) - quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const [updatedProduct] = await db.update(products)
      .set({ stockQuantity: newStock })
      .where(eq(products.id, productId))
      .returning();

    return updatedProduct;
  }
}
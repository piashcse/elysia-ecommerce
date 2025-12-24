import { db } from '../../../config/database';
import { products, categories } from '../../../database/schema';
import { eq, and, or, ilike, gte, lte, gt, desc, sql } from 'drizzle-orm';
import { CreateProductDto, UpdateProductDto } from '../dto/ProductDto';
import { NotFoundError } from '../../../core/errors';

export class ProductService {
  async createProduct(createProductDto: CreateProductDto): Promise<any> {
    // Check if category exists
    if (createProductDto.categoryId) {
      const [category] = await db.select().from(categories).where(eq(categories.id, createProductDto.categoryId)).limit(1);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const [newProduct] = await db.insert(products).values({
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price.toString(),
      imageUrl: createProductDto.imageUrl,
      stockQuantity: createProductDto.stockQuantity,
      isActive: createProductDto.isActive ?? true,
      categoryId: createProductDto.categoryId,
      sku: createProductDto.sku,
      sellerId: createProductDto.sellerId,
    }).returning();

    return newProduct;
  }

  async findProductById(id: string): Promise<any | null> {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return product || null;
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
    const product = await this.findProductById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // If category is being updated, check if it exists
    if (updateProductDto.categoryId) {
      const [category] = await db.select().from(categories).where(eq(categories.id, updateProductDto.categoryId)).limit(1);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const updateData: any = { ...updateProductDto };
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price.toString();
    }

    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findProductById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await db.delete(products).where(eq(products.id, id));
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
  ): Promise<{ products: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.search) {
      conditions.push(ilike(products.name, `%${filters.search}%`));
    }

    if (filters.category) {
      conditions.push(eq(products.categoryId, filters.category));
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(products.price, filters.minPrice.toString()));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(products.price, filters.maxPrice.toString()));
    }

    if (filters.inStock) {
      conditions.push(gt(products.stockQuantity, 0));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const productsResult = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const total = countResult ? Number(countResult.count) : 0;

    return { products: productsResult, total };
  }

  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const productsResult = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    const total = countResult ? Number(countResult.count) : 0;

    return { products: productsResult, total };
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
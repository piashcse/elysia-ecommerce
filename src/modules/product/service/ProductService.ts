import { getDB } from '../../../config/database';
import { categories, products } from '../../../database/schema';
import { and, desc, eq, gt, gte, ilike, lte, sql } from 'drizzle-orm';
import { CreateProductDto, UpdateProductDto } from '../dto/ProductDto';
import { NotFoundError } from '../../../core/errors';
import { BaseRepositoryImpl } from '../../../database/repositories/BaseRepository';
import { cacheManager } from '../../../utils/cache';

// Create a specific repository for products
class ProductRepository extends BaseRepositoryImpl<typeof products.$inferSelect, typeof products> {
  constructor() {
    super(products);
  }

  async findProductByIdWithDetails(id: string): Promise<any> {
    // Try to get from cache first
    const cachedProduct = await cacheManager.getCachedProduct(id);
    if (cachedProduct) {
      return cachedProduct;
    }

    const [product] = await this.db
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

    // Cache the result for future requests
    if (product) {
      await cacheManager.cacheProduct(id, product);
    }

    return product || null;
  }

  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: any[]; total: number; totalPages: number; currentPage: number }> {
    const offset = (page - 1) * limit;
    const cacheKey = `products:category:${categoryId}:${page}:${limit}`;

    // Try to get from cache first
    const cachedResult = await cacheManager.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const productsResult = await this.db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    const total = countResult ? Number(countResult.count) : 0;
    const totalPages = Math.ceil(total / limit);

    const result = { 
      data: productsResult, 
      total,
      totalPages,
      currentPage: page
    };

    // Cache the result for future requests (shorter TTL for frequently changing data)
    await cacheManager.set(cacheKey, result, { ttl: 300 }); // 5 minutes

    return result;
  }

  async updateProductStock(productId: string, quantity: number): Promise<any> {
    const [product] = await this.db.select().from(products).where(eq(products.id, productId)).limit(1);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const newStock = Number(product.stockQuantity) - quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const [updatedProduct] = await this.db.update(products)
      .set({ stockQuantity: newStock })
      .where(eq(products.id, productId))
      .returning();

    // Invalidate the cached product
    await cacheManager.del(`product:${productId}`);

    return updatedProduct;
  }
}

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  private get db() {
    return getDB();
  }

  async createProduct(createProductDto: CreateProductDto): Promise<any> {
    // Check if category exists
    if (createProductDto.categoryId) {
      const [category] = await this.db.select().from(categories).where(eq(categories.id, createProductDto.categoryId)).limit(1);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const newProduct = await this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price.toString(),
      imageUrl: createProductDto.imageUrl,
      stockQuantity: createProductDto.stockQuantity,
      isActive: createProductDto.isActive ?? true,
      categoryId: createProductDto.categoryId,
      sku: createProductDto.sku,
      sellerId: createProductDto.sellerId,
    });

    return newProduct;
  }

  async findProductById(id: string): Promise<any | null> {
    return await this.productRepository.findById(id);
  }

  async findProductByIdWithDetails(id: string): Promise<any> {
    return await this.productRepository.findProductByIdWithDetails(id);
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<any> {
    const product = await this.findProductById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // If category is being updated, check if it exists
    if (updateProductDto.categoryId) {
      const [category] = await this.db.select().from(categories).where(eq(categories.id, updateProductDto.categoryId)).limit(1);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const updateData: any = { ...updateProductDto };
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price.toString();
    }

    const updatedProduct = await this.productRepository.update(id, updateData);

    // Invalidate the cached product
    await cacheManager.del(`product:${id}`);

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findProductById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await this.productRepository.delete(id);

    // Invalidate the cached product
    await cacheManager.del(`product:${id}`);
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
    // Create cache key based on filters
    const cacheKey = `products:all:${page}:${limit}:${JSON.stringify(filters)}`;
    
    // Try to get from cache first
    const cachedResult = await cacheManager.get<any>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Build custom query for complex filtering
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

    const productsResult = await this.db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const total = countResult ? Number(countResult.count) : 0;

    const result = { products: productsResult, total };

    // Cache the result for future requests (shorter TTL for frequently changing data)
    await cacheManager.set(cacheKey, result, { ttl: 300 }); // 5 minutes

    return result;
  }

  async getProductsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ products: any[]; total: number }> {
    const result = await this.productRepository.getProductsByCategory(categoryId, page, limit);
    return { products: result.data, total: result.total };
  }

  async updateProductStock(productId: string, quantity: number): Promise<any> {
    return await this.productRepository.updateProductStock(productId, quantity);
  }
}
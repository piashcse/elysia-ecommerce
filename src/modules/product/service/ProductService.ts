import { AppDataSource } from '../../../config/database';
import { Product } from '../entity/Product';
import { Category } from '../../category/entity/Category';
import { CreateProductDto, UpdateProductDto } from '../dto/ProductDto';
import { NotFoundError, ConflictError } from '../../../core/errors';

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);
  private categoryRepository = AppDataSource.getRepository(Category);

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    // Check if category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const product = new Product();
    Object.assign(product, createProductDto);
    product.category = category;

    return this.productRepository.save(product);
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category']
    });
  }

  async findProductByIdWithDetails(id: string): Promise<any> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.id = :id', { id })
      .getOne();
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category']
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // If category is being updated, check if it exists
    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId }
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }

      product.category = category;
    }

    // Update other properties
    Object.assign(product, updateProductDto);
    
    // Remove categoryId from update object since we handled the relation separately
    delete (product as any).categoryId;

    return this.productRepository.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await this.productRepository.remove(product);
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
  ): Promise<{ products: Product[]; total: number }> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC');

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere('product.name ILIKE :search OR product.description ILIKE :search', {
        search: `%${filters.search}%`
      });
    }

    if (filters.category) {
      queryBuilder.andWhere('product.categoryId = :category', { category: filters.category });
    }

    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.inStock) {
      queryBuilder.andWhere('product.stock > 0');
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive: filters.isActive });
    }

    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { products, total };
  }

  async getProductsByCategory(
    categoryId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ products: Product[]; total: number }> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.categoryId = :categoryId', { categoryId })
      .orderBy('product.createdAt', 'DESC');

    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { products, total };
  }

  async updateProductStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Calculate new stock
    const newStock = product.stock - quantity;
    
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    product.stock = newStock;
    return this.productRepository.save(product);
  }
}
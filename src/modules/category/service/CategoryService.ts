import { AppDataSource } from '../../../config/database';
import { Category } from '../entity/Category';
import { Product } from '../../product/entity/Product';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/CategoryDto';
import { NotFoundError, ConflictError } from '../../../core/errors';

export class CategoryService {
  private categoryRepository = AppDataSource.getRepository(Category);
  private productRepository = AppDataSource.getRepository(Product);

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with the same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name }
    });

    if (existingCategory) {
      throw new ConflictError('Category with this name already exists');
    }

    const category = new Category();
    Object.assign(category, createCategoryDto);

    return this.categoryRepository.save(category);
  }

  async findCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // If name is being updated, check if it's already taken by another category
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name }
      });

      if (existingCategory) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ 
      where: { id },
      relations: ['products']
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has associated products
    if (category.products && category.products.length > 0) {
      throw new Error('Cannot delete category with associated products');
    }

    await this.categoryRepository.remove(category);
  }

  async getAllCategories(
    page: number = 1, 
    limit: number = 10,
    filters: {
      search?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{ categories: Category[]; total: number }> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .orderBy('category.createdAt', 'DESC');

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere('category.name ILIKE :search OR category.description ILIKE :search', {
        search: `%${filters.search}%`
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: filters.isActive });
    }

    const [categories, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { categories, total };
  }

  async getCategoryWithProducts(id: string, page: number = 1, limit: number = 10): Promise<any> {
    // Get the category
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Get products in this category with pagination
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.categoryId = :categoryId', { categoryId: id })
      .orderBy('product.createdAt', 'DESC');

    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      category,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
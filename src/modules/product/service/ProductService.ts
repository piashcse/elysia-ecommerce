import { and, asc, desc, eq, gt, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import {
  brands,
  categories,
  productImages,
  products,
  productVariants,
  users,
  variantAttributes,
} from '../../../database/schema';
import { CreateProductDto, UpdateProductDto } from '../dto/ProductDto';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { slugify } from '../../brand/service/BrandService';

interface Actor {
  sub: string;
  role: UserRole;
}

export interface ProductImageInput {
  imageUrl: string;
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface ProductVariantInput {
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive?: boolean;
  attributes?: Array<{ name: string; value: string }>;
}

export class ProductService extends BaseService {
  constructor() {
    super(products);
  }

  private async assertCategory(categoryId?: string | null) {
    if (!categoryId) return;
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!category) throw new NotFoundError('Category not found');
  }

  private async assertBrand(brandId?: string | null) {
    if (!brandId) return;
    const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.id, brandId)).limit(1);
    if (!brand) throw new NotFoundError('Brand not found');
  }

  private async assertSeller(sellerId: string) {
    const [seller] = await db
      .select({ id: users.id, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller || !seller.isActive) throw new NotFoundError('Seller not found');
    if (seller.role !== UserRole.SELLER && seller.role !== UserRole.ADMIN) {
      throw new ValidationError('The selected user is not a seller');
    }
  }

  private async getManageableProduct(actor: Actor, productId: string) {
    const product = await this.findByIdOrFail(productId, 'Product');
    if (actor.role !== UserRole.ADMIN && product.sellerId !== actor.sub) {
      throw new ForbiddenError('You can only manage your own products');
    }
    return product;
  }

  async getBySlug(slug: string, includeInactive = false) {
    const [product] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (!product) return null;
    return this.findProductByIdWithDetails(product.id, includeInactive);
  }

  async getRelated(id: string, limit = 8) {
    const [product] = await db.select({ id: products.id, categoryId: products.categoryId, brandId: products.brandId })
      .from(products).where(eq(products.id, id)).limit(1);
    if (!product) throw new NotFoundError('Product not found');

    const conditions = [eq(products.isActive, true), sql`${products.id} <> ${id}`];
    if (product.categoryId || product.brandId) {
      conditions.push(or(
        product.categoryId ? eq(products.categoryId, product.categoryId) : undefined,
        product.brandId ? eq(products.brandId, product.brandId) : undefined
      )!);
    }

    return db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      imageUrl: products.imageUrl,
      stockQuantity: products.stockQuantity,
    }).from(products).where(and(...conditions)).limit(Math.min(20, Math.max(1, limit)));
  }

  async getFacets() {
    const [categoryFacets, brandFacets, priceRange, availability] = await Promise.all([
      db.select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`,
      }).from(products).where(eq(products.isActive, true)).groupBy(products.categoryId),
      db.select({
        brandId: products.brandId,
        count: sql<number>`count(*)`,
      }).from(products).where(eq(products.isActive, true)).groupBy(products.brandId),
      db.select({
        min: sql<string>`min(${products.price})`,
        max: sql<string>`max(${products.price})`,
      }).from(products).where(eq(products.isActive, true)),
      db.select({
        inStock: sql<number>`count(*) filter (where ${products.stockQuantity} > 0)`,
        outOfStock: sql<number>`count(*) filter (where ${products.stockQuantity} = 0)`,
      }).from(products).where(eq(products.isActive, true)),
    ]);

    return {
      categories: categoryFacets.map((item) => ({ categoryId: item.categoryId, count: Number(item.count) })),
      brands: brandFacets.map((item) => ({ brandId: item.brandId, count: Number(item.count) })),
      price: { min: priceRange[0]?.min ?? '0', max: priceRange[0]?.max ?? '0' },
      availability: {
        inStock: Number(availability[0]?.inStock ?? 0),
        outOfStock: Number(availability[0]?.outOfStock ?? 0),
      },
    };
  }

  async createProduct(createProductDto: CreateProductDto): Promise<any> {
    await this.assertCategory(createProductDto.categoryId);
    await this.assertBrand(createProductDto.brandId);
    await this.assertSeller(createProductDto.sellerId);

    return this.create({
      ...createProductDto,
      slug: createProductDto.slug ?? slugify(createProductDto.name),
      price: createProductDto.price.toString(),
      weightGrams: createProductDto.weightGrams ?? 0,
      isActive: createProductDto.isActive ?? true,
    });
  }

  async findProductByIdWithDetails(id: string, includeInactive = false): Promise<any> {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        metaTitle: products.metaTitle,
        metaDescription: products.metaDescription,
        price: products.price,
        imageUrl: products.imageUrl,
        stockQuantity: products.stockQuantity,
        weightGrams: products.weightGrams,
        isActive: products.isActive,
        categoryId: products.categoryId,
        brandId: products.brandId,
        sellerId: products.sellerId,
        sku: products.sku,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          imageUrl: categories.imageUrl,
          isActive: categories.isActive,
        },
        brand: {
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
          logoUrl: brands.logoUrl,
        },
        seller: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!product) return null;
    if (!includeInactive && !product.isActive) return null;

    const [images, variants] = await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(desc(productImages.isPrimary), asc(productImages.displayOrder)),
      db
        .select()
        .from(productVariants)
        .where(includeInactive ? eq(productVariants.productId, id) : and(eq(productVariants.productId, id), eq(productVariants.isActive, true))),
    ]);

    const variantIds = variants.map((variant) => variant.id);
    const attributes = variantIds.length
      ? await db.select().from(variantAttributes).where(inArray(variantAttributes.variantId, variantIds))
      : [];

    return {
      ...product,
      images,
      variants: variants.map((variant) => ({
        ...variant,
        attributes: attributes
          .filter((attribute) => attribute.variantId === variant.id)
          .map((attribute) => ({ name: attribute.attributeName, value: attribute.attributeValue })),
      })),
    };
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<any> {
    await this.findByIdOrFail(id, 'Product');

    if (updateProductDto.categoryId) await this.assertCategory(updateProductDto.categoryId);
    if (updateProductDto.brandId) await this.assertBrand(updateProductDto.brandId);
    if (updateProductDto.sellerId) await this.assertSeller(updateProductDto.sellerId);

    const updateData: any = { ...updateProductDto };
    if (updateProductDto.price !== undefined) updateData.price = updateProductDto.price.toString();
    if (updateProductDto.name && !updateProductDto.slug) updateData.slug = slugify(updateProductDto.name);

    await db
      .update(products)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(products.id, id));

    return this.findProductByIdWithDetails(id, true);
  }

  async deleteProduct(id: string): Promise<void> {
    const deleted = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    if (!deleted.length) throw new NotFoundError('Product not found');
  }

  async getAllProducts(
    page: number = 1,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    filters: {
      search?: string;
      category?: string;
      brandId?: string;
      sellerId?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      isActive?: boolean;
      sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(or(
        ilike(products.name, term),
        ilike(products.sku, term),
        ilike(products.description, term)
      ));
    }
    if (filters.category) conditions.push(eq(products.categoryId, filters.category));
    if (filters.sellerId) conditions.push(eq(products.sellerId, filters.sellerId));
    if (filters.brandId) conditions.push(eq(products.brandId, filters.brandId));
    if (filters.minPrice !== undefined) conditions.push(gte(products.price, filters.minPrice.toString()));
    if (filters.maxPrice !== undefined) conditions.push(lte(products.price, filters.maxPrice.toString()));
    if (filters.inStock) conditions.push(gt(products.stockQuantity, 0));
    if (filters.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));

    const sortColumn = filters.sortBy === 'name'
      ? products.name
      : filters.sortBy === 'price'
        ? products.price
        : filters.sortBy === 'updatedAt'
          ? products.updatedAt
          : products.createdAt;

    const orderByClause = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    return this.findAll(page, limit, conditions, orderByClause);
  }

  async getImages(productId: string): Promise<any[]> {
    return db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(desc(productImages.isPrimary), asc(productImages.displayOrder));
  }

  async addImage(actor: Actor, productId: string, input: ProductImageInput): Promise<any> {
    await this.getManageableProduct(actor, productId);

    if (input.isPrimary) {
      await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, productId));
    }

    const [image] = await db
      .insert(productImages)
      .values({
        productId,
        imageUrl: input.imageUrl,
        altText: input.altText,
        displayOrder: input.displayOrder ?? 0,
        isPrimary: input.isPrimary ?? false,
      })
      .returning();

    return image;
  }

  async updateImage(actor: Actor, imageId: string, input: Partial<ProductImageInput>): Promise<any> {
    const [image] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
    if (!image) throw new NotFoundError('Product image not found');
    await this.getManageableProduct(actor, image.productId);

    if (input.isPrimary) {
      await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, image.productId));
    }

    const [updated] = await db
      .update(productImages)
      .set({
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.altText !== undefined ? { altText: input.altText } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
      })
      .where(eq(productImages.id, imageId))
      .returning();

    return updated;
  }

  async deleteImage(actor: Actor, imageId: string): Promise<void> {
    const [image] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
    if (!image) throw new NotFoundError('Product image not found');
    await this.getManageableProduct(actor, image.productId);
    await db.delete(productImages).where(eq(productImages.id, imageId));
  }

  async getVariants(productId: string): Promise<any[]> {
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
    if (!variants.length) return [];
    const attributes = await db
      .select()
      .from(variantAttributes)
      .where(inArray(variantAttributes.variantId, variants.map((variant) => variant.id)));

    return variants.map((variant) => ({
      ...variant,
      attributes: attributes
        .filter((attribute) => attribute.variantId === variant.id)
        .map((attribute) => ({ name: attribute.attributeName, value: attribute.attributeValue })),
    }));
  }

  async createVariant(actor: Actor, productId: string, input: ProductVariantInput): Promise<any> {
    await this.getManageableProduct(actor, productId);

    return db.transaction(async (tx) => {
      const [variant] = await tx
        .insert(productVariants)
        .values({
          productId,
          sku: input.sku,
          name: input.name,
          price: input.price.toString(),
          stockQuantity: input.stockQuantity,
          imageUrl: input.imageUrl,
          isActive: input.isActive ?? true,
        })
        .returning();

      if (input.attributes?.length && variant) {
        await tx.insert(variantAttributes).values(
          input.attributes.map((attribute) => ({
            variantId: variant.id,
            attributeName: attribute.name,
            attributeValue: attribute.value,
          }))
        );
      }

      return variant;
    });
  }

  async updateVariant(actor: Actor, variantId: string, input: Partial<ProductVariantInput>): Promise<any> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
    if (!variant) throw new NotFoundError('Product variant not found');
    await this.getManageableProduct(actor, variant.productId);

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(productVariants)
        .set({
          ...(input.sku !== undefined ? { sku: input.sku } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.price !== undefined ? { price: input.price.toString() } : {}),
          ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, variantId))
        .returning();

      if (input.attributes) {
        await tx.delete(variantAttributes).where(eq(variantAttributes.variantId, variantId));
        if (input.attributes.length) {
          await tx.insert(variantAttributes).values(
            input.attributes.map((attribute) => ({
              variantId,
              attributeName: attribute.name,
              attributeValue: attribute.value,
            }))
          );
        }
      }

      return updated;
    });
  }

  async deleteVariant(actor: Actor, variantId: string): Promise<void> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
    if (!variant) throw new NotFoundError('Product variant not found');
    await this.getManageableProduct(actor, variant.productId);
    await db.delete(productVariants).where(eq(productVariants.id, variantId));
  }
}

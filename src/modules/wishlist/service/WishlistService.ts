import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { products, wishlists } from '../../../database/schema';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';

export class WishlistService extends BaseService<typeof wishlists> {
  constructor() {
    super(wishlists);
  }

  async addToWishlist(userId: string, productId: string): Promise<any> {
    const [product] = await db
      .select({ id: products.id, isActive: products.isActive })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) throw new NotFoundError('Product not found');
    if (!product.isActive) throw new ConflictError('Product is not available', 'PRODUCT_INACTIVE');

    const [existingWishlistItem] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);

    if (existingWishlistItem) {
      throw new ConflictError('Product already exists in wishlist');
    }

    return this.create({ userId, productId });
  }

  async removeItem(userId: string, wishlistItemId: string): Promise<void> {
    const [item] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.id, wishlistItemId), eq(wishlists.userId, userId)))
      .limit(1);

    if (!item) throw new NotFoundError('Wishlist item not found');
    await this.delete(item.id);
  }

  async removeByUserAndProduct(userId: string, productId: string): Promise<void> {
    const [wishlistItem] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);

    if (!wishlistItem) throw new NotFoundError('Wishlist item not found');
    await this.delete(wishlistItem.id);
  }

  async toggle(userId: string, productId: string): Promise<{ inWishlist: boolean; item?: any }> {
    const [existing] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);

    if (existing) {
      await this.delete(existing.id);
      return { inWishlist: false };
    }

    const item = await this.addToWishlist(userId, productId);
    return { inWishlist: true, item };
  }

  async hasProduct(userId: string, productId: string): Promise<boolean> {
    const [item] = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);
    return Boolean(item);
  }

  async getWishlistForUser(
    userId: string,
    page: number = 1,
    limit: number = PAGINATION.MAX_LIMIT
  ): Promise<any[]> {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit))) : PAGINATION.MAX_LIMIT;
    const offset = (safePage - 1) * safeLimit;

    return db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: products,
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt))
      .limit(safeLimit)
      .offset(offset);
  }

  async getWishlistCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wishlists)
      .where(eq(wishlists.userId, userId));
    return result ? Number(result.count) : 0;
  }
}

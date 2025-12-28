import {db} from '../../../config/database';
import {products, users, wishlists} from '../../../database/schema';
import {and, desc, eq, sql} from 'drizzle-orm';
import {ConflictError, NotFoundError} from '../../../core/errors';

export class WishlistService {
  async addToWishlist(userId: string, productId: string): Promise<any> {
    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if product exists
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if item already exists in wishlist
    const existingWishlistItem = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ))
      .limit(1);

    if (existingWishlistItem.length > 0) {
      throw new ConflictError('Product already exists in wishlist');
    }

    const [newWishlistItem] = await db.insert(wishlists).values({
      userId: userId,
      productId: productId,
    }).returning();

    return newWishlistItem;
  }

  async removeFromWishlist(wishlistId: string): Promise<void> {
    const [wishlistItem] = await db.select().from(wishlists).where(eq(wishlists.id, wishlistId)).limit(1);

    if (!wishlistItem) {
      throw new NotFoundError('Wishlist item not found');
    }

    await db.delete(wishlists).where(eq(wishlists.id, wishlistId));
  }

  async removeByUserAndProduct(userId: string, productId: string): Promise<void> {
    const [wishlistItem] = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ))
      .limit(1);

    if (!wishlistItem) {
      throw new NotFoundError('Wishlist item not found');
    }

    await db.delete(wishlists).where(eq(wishlists.id, wishlistItem.id));
  }

  async getWishlistForUser(userId: string): Promise<any[]> {
    const wishlistItems = await db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: {
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
        }
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));

    return wishlistItems;
  }

  async isProductInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlistItem = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ))
      .limit(1);

    return wishlistItem.length > 0;
  }

  async clearWishlist(userId: string): Promise<void> {
    await db.delete(wishlists).where(eq(wishlists.userId, userId));
  }

  async getWishlistCountForUser(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wishlists)
      .where(eq(wishlists.userId, userId));

    return Number(result?.count || 0);
  }
}
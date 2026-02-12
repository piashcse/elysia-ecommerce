import { db } from '../../../config/database';
import { products, users, wishlists } from '../../../database/schema';
import { and, desc, eq } from 'drizzle-orm';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class WishlistService extends BaseService<typeof wishlists> {
  constructor() {
    super(wishlists);
  }

  async addToWishlist(userId: string, productId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw new NotFoundError('Product not found');

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

  async removeByUserAndProduct(userId: string, productId: string): Promise<void> {
    const [wishlistItem] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .limit(1);

    if (!wishlistItem) throw new NotFoundError('Wishlist item not found');

    return this.delete(wishlistItem.id);
  }

  async getWishlistForUser(userId: string): Promise<any[]> {
    return db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: products
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));
  }
}
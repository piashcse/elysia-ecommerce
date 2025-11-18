import { AppDataSource } from '../../../config/database';
import { Wishlist } from '../entity/Wishlist';
import { User } from '../../user/entity/User';
import { Product } from '../../product/entity/Product';
import { CreateWishlistDto } from '../dto/WishlistDto';
import { NotFoundError, ConflictError } from '../../../core/errors';

export class WishlistService {
  private wishlistRepository = AppDataSource.getRepository(Wishlist);
  private userRepository = AppDataSource.getRepository(User);
  private productRepository = AppDataSource.getRepository(Product);

  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if product exists
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if item already exists in wishlist
    const existingWishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    if (existingWishlistItem) {
      throw new ConflictError('Product already exists in wishlist');
    }

    const wishlistItem = new Wishlist();
    wishlistItem.user = user;
    wishlistItem.product = product;

    return this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(wishlistId: string): Promise<void> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { id: wishlistId }
    });

    if (!wishlistItem) {
      throw new NotFoundError('Wishlist item not found');
    }

    await this.wishlistRepository.remove(wishlistItem);
  }

  async removeByUserAndProduct(userId: string, productId: string): Promise<void> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    if (!wishlistItem) {
      throw new NotFoundError('Wishlist item not found');
    }

    await this.wishlistRepository.remove(wishlistItem);
  }

  async getWishlistForUser(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository
      .createQueryBuilder('wishlist')
      .leftJoinAndSelect('wishlist.product', 'product')
      .leftJoinAndSelect('wishlist.user', 'user')
      .where('wishlist.user.id = :userId', { userId })
      .orderBy('wishlist.createdAt', 'DESC')
      .getMany();
  }

  async isProductInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } }
    });

    return !!wishlistItem;
  }

  async clearWishlist(userId: string): Promise<void> {
    const wishlistItems = await this.wishlistRepository.find({
      where: { user: { id: userId } }
    });

    if (wishlistItems.length > 0) {
      await this.wishlistRepository.remove(wishlistItems);
    }
  }

  async getWishlistCountForUser(userId: string): Promise<number> {
    return this.wishlistRepository.count({
      where: { user: { id: userId } }
    });
  }
}
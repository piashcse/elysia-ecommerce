import { AppDataSource } from '../../../config/database';
import { Cart } from '../entity/Cart';
import { CartItem } from '../entity/CartItem';
import { Product } from '../../product/entity/Product';
import { User } from '../../user/entity/User';
import { AddToCartDto, UpdateCartItemDto } from '../dto/CartDto';
import { NotFoundError, ConflictError } from '../../../core/errors';

export class CartService {
  private cartRepository = AppDataSource.getRepository(Cart);
  private cartItemRepository = AppDataSource.getRepository(CartItem);
  private productRepository = AppDataSource.getRepository(Product);
  private userRepository = AppDataSource.getRepository(User);

  async createCart(userId?: string, sessionId?: string): Promise<Cart> {
    // Check if user exists if userId is provided
    let user: User | undefined;
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundError('User not found');
      }
    }

    // Check if cart already exists for user or session
    let existingCart: Cart | null = null;
    if (userId) {
      existingCart = await this.cartRepository.findOne({ where: { user: { id: userId } } });
    } else if (sessionId) {
      existingCart = await this.cartRepository.findOne({ where: { sessionId } });
    }

    if (existingCart) {
      return existingCart;
    }

    const cart = new Cart();
    cart.user = user;
    cart.sessionId = sessionId;
    return this.cartRepository.save(cart);
  }

  async findCartByUserOrSession(userId?: string, sessionId?: string): Promise<Cart | null> {
    if (userId) {
      return this.cartRepository.findOne({
        where: { user: { id: userId } },
        relations: ['items', 'items.product']
      });
    } else if (sessionId) {
      return this.cartRepository.findOne({
        where: { sessionId },
        relations: ['items', 'items.product']
      });
    }
    return null;
  }

  async getCartWithItems(cartId: string): Promise<any> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product', 'user']
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    // Calculate cart totals
    let totalItems = 0;
    let totalAmount = 0;

    if (cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        totalItems += item.quantity;
        totalAmount += item.quantity * parseFloat(item.product.price.toString());
      }
    }

    return {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        subtotal: item.quantity * parseFloat(item.product.price.toString())
      })),
      totalItems,
      totalAmount,
    };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<any> {
    const product = await this.productRepository.findOne({ where: { id: addToCartDto.productId } });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.stock < addToCartDto.quantity) {
      throw new Error('Insufficient stock for this product');
    }

    // Find or create user's cart
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items']
    });

    if (!cart) {
      cart = await this.createCart(userId, undefined);
    }

    // Check if product already exists in cart
    let cartItem = cart.items?.find(item => item.product.id === addToCartDto.productId);

    if (cartItem) {
      // Update quantity if item exists
      cartItem.quantity += addToCartDto.quantity;
      if (product.stock < cartItem.quantity) {
        throw new Error('Insufficient stock for the updated quantity');
      }
    } else {
      // Create new cart item
      cartItem = new CartItem();
      cartItem.cart = cart;
      cartItem.product = product;
      cartItem.quantity = addToCartDto.quantity;
    }

    await this.cartItemRepository.save(cartItem);

    // Reload cart with updated items
    return this.getCartWithItems(cart.id);
  }

  async updateCartItem(cartItemId: string, updateCartItemDto: UpdateCartItemDto): Promise<any> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart', 'product']
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    if (cartItem.product.stock < updateCartItemDto.quantity) {
      throw new Error('Insufficient stock for the updated quantity');
    }

    cartItem.quantity = updateCartItemDto.quantity;
    await this.cartItemRepository.save(cartItem);

    // Reload cart with updated items
    return this.getCartWithItems(cartItem.cart.id);
  }

  async removeCartItem(cartItemId: string): Promise<any> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart', 'product']
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    const cartId = cartItem.cart.id;
    await this.cartItemRepository.remove(cartItem);

    // Reload cart with updated items
    return this.getCartWithItems(cartId);
  }

  async clearCart(cartId: string): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items']
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }
  }

  async getCartForUser(userId: string): Promise<any> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user']
    });

    if (!cart) {
      return null;
    }

    // Calculate cart totals
    let totalItems = 0;
    let totalAmount = 0;

    if (cart.items && cart.items.length > 0) {
      for (const item of cart.items) {
        totalItems += item.quantity;
        totalAmount += item.quantity * parseFloat(item.product.price.toString());
      }
    }

    return {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        subtotal: item.quantity * parseFloat(item.product.price.toString())
      })),
      totalItems,
      totalAmount,
    };
  }
}
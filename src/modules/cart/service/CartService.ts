import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { cartItems, carts, products, users } from '../../../database/schema';
import { AddToCartDto, UpdateCartItemDto } from '../dto/CartDto';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class CartService extends BaseService<typeof carts> {
  constructor() {
    super(carts);
  }

  async createCart(userId?: string): Promise<any> {
    if (!userId) throw new ValidationError('Authentication is required for a cart');

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundError('User not found');

    const [existingCart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (existingCart) return existingCart;

    return this.create({ userId });
  }

  async getCartWithItems(cartId: string): Promise<any> {
    const results = await db
      .select({
        cart: carts,
        cartItem: cartItems,
        product: products,
      })
      .from(carts)
      .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(carts.id, cartId));

    const cart = results[0]?.cart;
    if (!cart) throw new NotFoundError('Cart not found');

    let totalItems = 0;
    let totalAmount = 0;

    const items = results
      .filter((row) => row.cartItem !== null)
      .map((row) => {
        const itemTotal = Number(row.cartItem!.quantity) * Number(row.product?.price ?? 0);
        totalItems += row.cartItem!.quantity;
        totalAmount += itemTotal;
        return {
          ...row.cartItem,
          subtotal: itemTotal,
          product: row.product,
        };
      });

    return { ...cart, items, totalItems, totalAmount };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<any> {
    const [product] = await db.select().from(products).where(eq(products.id, addToCartDto.productId)).limit(1);
    if (!product) throw new NotFoundError('Product not found');
    if (!product.isActive) throw new ConflictError('Product is not available', 'PRODUCT_INACTIVE');

    if (product.stockQuantity < addToCartDto.quantity) {
      throw new ConflictError('Insufficient stock for this product', 'INSUFFICIENT_STOCK');
    }

    let [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!cart) cart = await this.createCart(userId);
    if (!cart) throw new NotFoundError('Cart not found');

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, addToCartDto.productId)))
      .limit(1);

    if (existingItem) {
      const newQuantity = existingItem.quantity + addToCartDto.quantity;
      if (product.stockQuantity < newQuantity) {
        throw new ConflictError('Insufficient stock for the updated quantity', 'INSUFFICIENT_STOCK');
      }
      await db.update(cartItems).set({ quantity: newQuantity, updatedAt: new Date() }).where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
      });
    }

    return this.getCartWithItems(cart.id);
  }

  async updateCartItem(userId: string, cartItemId: string, updateCartItemDto: UpdateCartItemDto): Promise<any> {
    const [item] = await db
      .select({ cartItem: cartItems, product: products })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cartId, carts.id))
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(and(eq(cartItems.id, cartItemId), eq(carts.userId, userId)))
      .limit(1);

    if (!item) throw new NotFoundError('Cart item not found');
    if (!item.product?.isActive) throw new ConflictError('Product is not available', 'PRODUCT_INACTIVE');
    if (item.product.stockQuantity < updateCartItemDto.quantity) {
      throw new ConflictError('Insufficient stock', 'INSUFFICIENT_STOCK');
    }

    await db
      .update(cartItems)
      .set({ quantity: updateCartItemDto.quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, cartItemId));

    return this.getCartWithItems(item.cartItem.cartId);
  }

  async removeCartItem(userId: string, cartItemId: string): Promise<any> {
    const [item] = await db
      .select({ cartItem: cartItems })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cartId, carts.id))
      .where(and(eq(cartItems.id, cartItemId), eq(carts.userId, userId)))
      .limit(1);

    if (!item) throw new NotFoundError('Cart item not found');

    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    return this.getCartWithItems(item.cartItem.cartId);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.findByIdOrFail(cartId, 'Cart');
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async getCartForUser(userId: string): Promise<any> {
    const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!cart) return null;
    return this.getCartWithItems(cart.id);
  }

  async getCartCount(userId: string): Promise<{ items: number; quantity: number }> {
    const [cart] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!cart) return { items: 0, quantity: 0 };

    const [result] = await db
      .select({
        items: sql<number>`count(*)`,
        quantity: sql<number>`coalesce(sum(${cartItems.quantity}), 0)`,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    return {
      items: result ? Number(result.items) : 0,
      quantity: result ? Number(result.quantity) : 0,
    };
  }
}

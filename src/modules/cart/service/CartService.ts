import { db } from '../../../config/database';
import { cartItems, carts, products, users } from '../../../database/schema';
import { and, eq } from 'drizzle-orm';
import { AddToCartDto, UpdateCartItemDto } from '../dto/CartDto';
import { NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class CartService extends BaseService<typeof carts> {
  constructor() {
    super(carts);
  }

  async createCart(userId?: string): Promise<any> {
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) throw new NotFoundError('User not found');

      const [existingCart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      if (existingCart) return existingCart;
    }

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

    if (results.length === 0) throw new NotFoundError('Cart not found');

    const cart = results[0].cart;
    let totalItems = 0;
    let totalAmount = 0;

    const items = results
      .filter(r => r.cartItem !== null)
      .map(r => {
        const itemTotal = Number(r.cartItem!.quantity) * Number(r.product!.price);
        totalItems += r.cartItem!.quantity;
        totalAmount += itemTotal;
        return {
          ...r.cartItem,
          subtotal: itemTotal,
          product: r.product
        };
      });

    return { ...cart, items, totalItems, totalAmount };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<any> {
    const [product] = await db.select().from(products).where(eq(products.id, addToCartDto.productId)).limit(1);
    if (!product) throw new NotFoundError('Product not found');

    if (Number(product.stockQuantity) < addToCartDto.quantity) {
      throw new Error('Insufficient stock for this product');
    }

    let [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!cart) cart = await this.createCart(userId);

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, addToCartDto.productId)))
      .limit(1);

    if (existingItem) {
      const newQuantity = existingItem.quantity + addToCartDto.quantity;
      if (Number(product.stockQuantity) < newQuantity) {
        throw new Error('Insufficient stock for the updated quantity');
      }
      await db.update(cartItems).set({ quantity: newQuantity }).where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
      });
    }

    return this.getCartWithItems(cart.id);
  }

  async updateCartItem(cartItemId: string, updateCartItemDto: UpdateCartItemDto): Promise<any> {
    const [item] = await db
      .select({ cartItem: cartItems, product: products })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (!item) throw new NotFoundError('Cart item not found');
    if (Number(item.product!.stockQuantity) < updateCartItemDto.quantity) {
      throw new Error('Insufficient stock');
    }

    await db.update(cartItems).set({ quantity: updateCartItemDto.quantity }).where(eq(cartItems.id, cartItemId));
    return this.getCartWithItems(item.cartItem.cartId);
  }

  async removeCartItem(cartItemId: string): Promise<any> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, cartItemId)).limit(1);
    if (!item) throw new NotFoundError('Cart item not found');

    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    return this.getCartWithItems(item.cartId);
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
}
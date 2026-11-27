import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { cartItems, carts, productVariants, products } from '../../../database/schema';
import { AddToCartDto, UpdateCartItemDto } from '../dto/CartDto';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import type { CartOwner } from '../cart-owner';

type CartItemRow = {
  cartItem: typeof cartItems.$inferSelect;
  product: typeof products.$inferSelect | null;
  variant: typeof productVariants.$inferSelect | null;
};

export class CartService extends BaseService {
  constructor() {
    super(carts);
  }

  private ownerCondition(owner: CartOwner) {
    return owner.userId
      ? eq(carts.userId, owner.userId)
      : and(eq(carts.sessionId, owner.sessionId!), isNull(carts.userId));
  }

  async getCart(owner: CartOwner): Promise<any | null> {
    if (!owner.userId && !owner.sessionId) return null;

    const [cart] = await db.select().from(carts).where(this.ownerCondition(owner)).limit(1);
    return cart ? this.getCartWithItems(cart.id) : null;
  }

  private async createCart(owner: CartOwner): Promise<any> {
    if (!owner.userId && !owner.sessionId) throw new NotFoundError('Cart owner is required');

    const existing = await this.getCart(owner);
    if (existing) return existing;

    return this.create({
      userId: owner.userId,
      sessionId: owner.sessionId,
    });
  }

  private async getOwnedCart(owner: CartOwner): Promise<any> {
    const [cart] = await db.select().from(carts).where(this.ownerCondition(owner)).limit(1);
    if (!cart) throw new NotFoundError('Cart not found');
    return cart;
  }

  async getCartWithItems(cartId: string): Promise<any> {
    const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
    if (!cart) throw new NotFoundError('Cart not found');

    const rows: CartItemRow[] = await db
      .select({
        cartItem: cartItems,
        product: products,
        variant: productVariants,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cartId));

    let totalItems = 0;
    let totalAmount = 0;

    const items = rows.map((row) => {
      const unitPrice = Number(row.variant?.price ?? row.product?.price ?? 0);
      const itemTotal = unitPrice * row.cartItem.quantity;
      totalItems += row.cartItem.quantity;
      totalAmount += itemTotal;
      return {
        ...row.cartItem,
        subtotal: itemTotal,
        product: row.product,
        variant: row.variant,
      };
    });

    return { ...cart, items, totalItems, totalAmount };
  }

  async addItem(owner: CartOwner, dto: AddToCartDto): Promise<any> {
    const [product] = await db.select().from(products).where(eq(products.id, dto.productId)).limit(1);
    if (!product) throw new NotFoundError('Product not found');
    if (!product.isActive) throw new ConflictError('Product is not available', 'PRODUCT_INACTIVE');

    let variant: typeof productVariants.$inferSelect | undefined;
    let unitStock = product.stockQuantity;

    if (dto.variantId) {
      [variant] = await db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.id, dto.variantId), eq(productVariants.productId, dto.productId)))
        .limit(1);

      if (!variant || !variant.isActive) throw new NotFoundError('Product variant not found');
      unitStock = variant.stockQuantity;
    }

    if (unitStock < dto.quantity) {
      throw new ConflictError('Insufficient stock for this item', 'INSUFFICIENT_STOCK');
    }

    const cart = await this.createCart(owner);
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, dto.productId),
        dto.variantId ? eq(cartItems.variantId, dto.variantId) : isNull(cartItems.variantId)
      ))
      .limit(1);

    if (existingItem) {
      const quantity = existingItem.quantity + dto.quantity;
      if (unitStock < quantity) {
        throw new ConflictError('Insufficient stock for the updated quantity', 'INSUFFICIENT_STOCK');
      }
      await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
      });
    }

    return this.getCartWithItems(cart.id);
  }

  async updateItem(owner: CartOwner, cartItemId: string, dto: UpdateCartItemDto): Promise<any> {
    const cart = await this.getOwnedCart(owner);
    const [row] = await db
      .select({ item: cartItems, product: products, variant: productVariants })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!row) throw new NotFoundError('Cart item not found');
    const stock = row.variant?.stockQuantity ?? row.product?.stockQuantity ?? 0;
    if (stock < dto.quantity) throw new ConflictError('Insufficient stock', 'INSUFFICIENT_STOCK');

    await db.update(cartItems).set({ quantity: dto.quantity }).where(eq(cartItems.id, cartItemId));
    return this.getCartWithItems(cart.id);
  }

  async removeItem(owner: CartOwner, cartItemId: string): Promise<any> {
    const cart = await this.getOwnedCart(owner);
    const deleted = await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cart.id)))
      .returning({ id: cartItems.id });

    if (!deleted.length) throw new NotFoundError('Cart item not found');
    return this.getCartWithItems(cart.id);
  }

  async clearCart(owner: CartOwner): Promise<void> {
    const cart = await this.getOwnedCart(owner);
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  async getCartCount(owner: CartOwner): Promise<{ items: number; quantity: number }> {
    const [result] = await db
      .select({
        items: sql<number>`count(${cartItems.id})`,
        quantity: sql<number>`coalesce(sum(${cartItems.quantity}), 0)`,
      })
      .from(carts)
      .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
      .where(this.ownerCondition(owner));

    return {
      items: result ? Number(result.items) : 0,
      quantity: result ? Number(result.quantity) : 0,
    };
  }

  async mergeGuestCart(userId: string, sessionId: string): Promise<any> {
    const [guestCart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.sessionId, sessionId), isNull(carts.userId)))
      .limit(1);

    if (!guestCart) return this.getCart({ userId });

    const userCart = await this.createCart({ userId });
    const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));

    for (const item of guestItems) {
      const [existing] = await db
        .select()
        .from(cartItems)
        .where(and(
          eq(cartItems.cartId, userCart.id),
          eq(cartItems.productId, item.productId),
          item.variantId ? eq(cartItems.variantId, item.variantId) : isNull(cartItems.variantId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(cartItems)
          .set({ quantity: existing.quantity + item.quantity })
          .where(eq(cartItems.id, existing.id));
      } else {
        await db.insert(cartItems).values({
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    }

    await db.delete(carts).where(eq(carts.id, guestCart.id));
    return this.getCartWithItems(userCart.id);
  }
}

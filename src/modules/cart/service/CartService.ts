import {db} from '../../../config/database';
import {cartItems, carts, products, users} from '../../../database/schema';
import {and, eq} from 'drizzle-orm';
import {AddToCartDto, UpdateCartItemDto} from '../dto/CartDto';
import {NotFoundError} from '../../../core/errors';

export class CartService {
  async createCart(userId?: string, sessionId?: string): Promise<any> {
    // Check if user exists if userId is provided
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new NotFoundError('User not found');
      }
    }

    // Check if cart already exists for user or session
    let existingCart: any | null = null;
    if (userId) {
      const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
      existingCart = cart;
    } else if (sessionId) {
      const [cart] = await db.select().from(carts).where(eq(carts.id, sessionId)).limit(1); // Assuming sessionId is treated as cart id
      existingCart = cart;
    }

    if (existingCart) {
      return existingCart;
    }

    const newCartArray = await db.insert(carts).values({
      userId: userId,
    }).returning();
    return newCartArray[0];
  }

  async findCartByUserOrSession(userId?: string, sessionId?: string): Promise<any | null> {
    if (userId) {
      const cart = await db
        .select()
        .from(carts)
        .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(carts.userId, userId));

      if (cart.length > 0) {
        return {
          ...cart[0].carts,
          items: cart.map(c => c.cartItems).filter(item => item !== null)
        };
      }
    } else if (sessionId) {
      const cart = await db
        .select()
        .from(carts)
        .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(carts.id, sessionId)); // Assuming sessionId is treated as cart id

      if (cart.length > 0) {
        return {
          ...cart[0].carts,
          items: cart.map(c => c.cartItems).filter(item => item !== null)
        };
      }
    }
    return null;
  }

  async getCartWithItems(cartId: string): Promise<any> {
    const cartItemsResult = await db
      .select({
        cart: carts,
        cartItem: cartItems,
        product: products,
        user: users,
      })
      .from(carts)
      .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(users, eq(carts.userId, users.id))
      .where(eq(carts.id, cartId));

    if (cartItemsResult.length === 0) {
      throw new NotFoundError('Cart not found');
    }

    const cart = cartItemsResult[0].cart;
    
    // Calculate cart totals
    let totalItems = 0;
    let totalAmount = 0;

    const items = cartItemsResult
      .filter(result => result.cartItem !== null)
      .map(result => {
        const itemTotal = Number(result.cartItem!.quantity) * Number(result.product!.price);
        totalItems += result.cartItem!.quantity;
        totalAmount += itemTotal;
        
        return {
          ...result.cartItem,
          subtotal: itemTotal,
          product: result.product
        };
      });

    return {
      ...cart,
      items,
      totalItems,
      totalAmount,
    };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<any> {
    const [product] = await db.select().from(products).where(eq(products.id, addToCartDto.productId)).limit(1);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (Number(product.stockQuantity) < addToCartDto.quantity) {
      throw new Error('Insufficient stock for this product');
    }

    // Find or create user's cart
    const cartResult = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    let cart = cartResult[0];

    if (!cart) {
      cart = await this.createCart(userId, undefined);
    }

    // Check if product already exists in cart
    const [existingCartItem] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, addToCartDto.productId)
      ))
      .limit(1);

    if (existingCartItem) {
      // Update quantity if item exists
      const newQuantity = existingCartItem.quantity + addToCartDto.quantity;
      if (Number(product.stockQuantity) < newQuantity) {
        throw new Error('Insufficient stock for the updated quantity');
      }
      
      const [updatedCartItem] = await db
        .update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existingCartItem.id))
        .returning();
    } else {
      // Create new cart item
      const [newCartItem] = await db.insert(cartItems).values({
        cartId: cart.id,
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
      }).returning();
    }

    // Reload cart with updated items
    return this.getCartWithItems(cart.id);
  }

  async updateCartItem(cartItemId: string, updateCartItemDto: UpdateCartItemDto): Promise<any> {
    const [cartItem] = await db
      .select({ 
        cartItem: cartItems,
        product: products,
        cart: carts,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(carts, eq(cartItems.cartId, carts.id))
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    if (Number(cartItem.product!.stockQuantity) < updateCartItemDto.quantity) {
      throw new Error('Insufficient stock for the updated quantity');
    }

    const [updatedCartItem] = await db
      .update(cartItems)
      .set({ quantity: updateCartItemDto.quantity })
      .where(eq(cartItems.id, cartItemId))
      .returning();

    // Reload cart with updated items
    return this.getCartWithItems(cartItem.cart!.id);
  }

  async removeCartItem(cartItemId: string): Promise<any> {
    const [cartItem] = await db
      .select({ 
        cartItem: cartItems,
        cart: carts,
      })
      .from(cartItems)
      .leftJoin(carts, eq(cartItems.cartId, carts.id))
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    const cartId = cartItem.cart!.id;
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));

    // Reload cart with updated items
    return this.getCartWithItems(cartId);
  }

  async clearCart(cartId: string): Promise<void> {
    const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async getCartForUser(userId: string): Promise<any> {
    const cartItemsResult = await db
      .select({
        cart: carts,
        cartItem: cartItems,
        product: products,
      })
      .from(carts)
      .leftJoin(cartItems, eq(carts.id, cartItems.cartId))
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(carts.userId, userId));

    if (cartItemsResult.length === 0) {
      return null;
    }

    const cart = cartItemsResult[0].cart;
    
    // Calculate cart totals
    let totalItems = 0;
    let totalAmount = 0;

    const items = cartItemsResult
      .filter(result => result.cartItem !== null)
      .map(result => {
        const itemTotal = Number(result.cartItem!.quantity) * Number(result.product!.price);
        totalItems += result.cartItem!.quantity;
        totalAmount += itemTotal;
        
        return {
          ...result.cartItem,
          subtotal: itemTotal,
          product: result.product
        };
      });

    return {
      ...cart,
      items,
      totalItems,
      totalAmount,
    };
  }
}
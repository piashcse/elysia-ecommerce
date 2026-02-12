import { Elysia, t } from 'elysia';
import { CartService } from '../service/CartService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const cartService = new CartService();

export const cartController = new Elysia({ prefix: '/cart', tags: ['Cart'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  // Get user's cart
  .get(
    '/',
    async ({ user }) => {
      const cart = await cartService.getCartForUser(user!.sub as string);
      return successResponse(cart || null, 'Cart retrieved successfully');
    },
    {
      response: {
        200: successSchema(t.Nullable(t.Any()))
      },
      detail: { summary: "Get current user's cart" }
    }
  )

  // Add item to cart
  .post(
    '/items',
    async ({ body, user }) => {
      const cart = await cartService.addToCart(user!.sub as string, body);
      return successResponse(cart, 'Item added to cart successfully');
    },
    {
      body: t.Object({
        productId: t.String(),
        quantity: t.Number({ minimum: 1 })
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Add item to cart' }
    }
  )

  // Update cart item quantity
  .put(
    '/items/:id',
    async ({ params, body }) => {
      const cart = await cartService.updateCartItem(params.id, body);
      return successResponse(cart, 'Cart item updated successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        quantity: t.Number({ minimum: 1 })
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema
      },
      detail: { summary: 'Update cart item quantity' }
    }
  )

  // Remove item from cart
  .delete(
    '/items/:id',
    async ({ params }) => {
      const cart = await cartService.removeCartItem(params.id);
      return successResponse(cart, 'Item removed from cart successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Remove item from cart' }
    }
  )

  // Clear entire cart
  .delete(
    '/',
    async ({ user }) => {
      const cart = await cartService.getCartForUser(user!.sub as string);
      if (cart) {
        await cartService.clearCart(cart.id);
      }
      return successResponse(null, 'Cart cleared successfully');
    },
    {
      response: {
        200: successSchema(t.Null())
      },
      detail: { summary: 'Clear entire cart' }
    }
  );

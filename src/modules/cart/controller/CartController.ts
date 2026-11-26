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
  .get(
    '/',
    async ({ user }) => {
      const cart = await cartService.getCartForUser(user!.sub);
      return successResponse(cart || null, 'Cart retrieved successfully');
    },
    {
      response: {
        200: successSchema(t.Nullable(t.Any()))
      },
      detail: { summary: "Get current user's cart" }
    }
  )

  .get(
    '/count',
    async ({ user }) => {
      const count = await cartService.getCartCount(user!.sub);
      return successResponse(count, 'Cart count retrieved successfully');
    },
    {
      response: { 200: successSchema() },
      detail: { summary: "Get the current user's cart item count" }
    }
  )

  .post(
    '/items',
    async ({ body, user }) => {
      const cart = await cartService.addToCart(user!.sub, body);
      return successResponse(cart, 'Item added to cart successfully');
    },
    {
      body: t.Object({
        productId: t.String({ format: 'uuid' }),
        quantity: t.Integer({ minimum: 1, maximum: 100 })
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Add item to cart' }
    }
  )

  .put(
    '/items/:id',
    async ({ params, body, user }) => {
      const cart = await cartService.updateCartItem(user!.sub, params.id, body);
      return successResponse(cart, 'Cart item updated successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        quantity: t.Integer({ minimum: 1, maximum: 100 })
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema
      },
      detail: { summary: 'Update cart item quantity' }
    }
  )

  .delete(
    '/items/:id',
    async ({ params, user }) => {
      const cart = await cartService.removeCartItem(user!.sub, params.id);
      return successResponse(cart, 'Item removed from cart successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Remove item from cart' }
    }
  )

  .delete(
    '/',
    async ({ user }) => {
      const cart = await cartService.getCartForUser(user!.sub);
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

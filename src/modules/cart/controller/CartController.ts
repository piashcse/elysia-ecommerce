import { Elysia, t } from 'elysia';
import { CartService } from '../service/CartService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { ValidationError } from '../../../core/errors';
import { resolveCartOwner } from '../cart-owner';
import { uuid } from '../../../core/schemas';

const cartService = new CartService();

export const cartController = new Elysia({ prefix: '/cart', tags: ['Cart'] })
  .use(authPlugin)
  .get('/', {
    response: { 200: successSchema(t.Nullable(t.Any())) },
    detail: { summary: "Get the current user's or guest cart" }
  }, async ({ user, headers, set }) => {
    const cart = await cartService.getCart(resolveCartOwner(user, headers, set));
    return successResponse(cart, 'Cart retrieved successfully');
  })
  .get('/count', {
    response: { 200: successSchema() },
    detail: { summary: "Get the current cart's item count" }
  }, async ({ user, headers, set }) => {
    const count = await cartService.getCartCount(resolveCartOwner(user, headers, set));
    return successResponse(count, 'Cart count retrieved successfully');
  })
  .post('/items', {
    body: t.Object({
      productId: uuid,
      variantId: t.Optional(uuid),
      quantity: t.Integer({ minimum: 1, maximum: 100 })
    }),
    response: { 200: successSchema(), 400: errorSchema, 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Add item to cart' }
  }, async ({ body, user, headers, set }) => {
    const cart = await cartService.addItem(resolveCartOwner(user, headers, set), body);
    return successResponse(cart, 'Item added to cart successfully');
  })
  .put('/items/:id', {
    params: t.Object({ id: uuid }),
    body: t.Object({ quantity: t.Integer({ minimum: 1, maximum: 100 }) }),
    response: { 200: successSchema(), 400: errorSchema, 404: errorSchema },
    detail: { summary: 'Update cart item quantity' }
  }, async ({ params, body, user, headers, set }) => {
    const cart = await cartService.updateItem(resolveCartOwner(user, headers, set), params.id, body);
    return successResponse(cart, 'Cart item updated successfully');
  })
  .delete('/items/:id', {
    params: t.Object({ id: uuid }),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Remove item from cart' }
  }, async ({ params, user, headers, set }) => {
    const cart = await cartService.removeItem(resolveCartOwner(user, headers, set), params.id);
    return successResponse(cart, 'Item removed from cart successfully');
  })
  .delete('/', {
    response: { 200: successSchema(t.Null()) },
    detail: { summary: 'Clear entire cart' }
  }, async ({ user, headers, set }) => {
    await cartService.clearCart(resolveCartOwner(user, headers, set));
    return successResponse(null, 'Cart cleared successfully');
  })
  .post('/merge', {
    isAuth: true,
    response: { 200: successSchema(), 422: errorSchema },
    detail: { summary: 'Merge the guest cart into the authenticated user cart' }
  }, async ({ user, headers }) => {
    const sessionId = headers['x-session-id'];
    if (!sessionId) throw new ValidationError('Missing X-Session-Id header');
    const cart = await cartService.mergeGuestCart(user!.sub, sessionId);
    return successResponse(cart, 'Guest cart merged successfully');
  });

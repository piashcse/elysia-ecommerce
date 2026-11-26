import { Elysia, t } from 'elysia';
import { WishlistService } from '../service/WishlistService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const wishlistService = new WishlistService();

export const wishlistController = new Elysia({ prefix: '/wishlist', tags: ['Wishlist'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  .get(
    '/',
    async ({ user, query }) => {
      const { page, limit } = getPagination(query);
      const wishlist = await wishlistService.getWishlistForUser(user!.sub, page, limit);
      return successResponse(wishlist, 'Wishlist retrieved successfully');
    },
    {
      query: t.Object({
        page: t.Optional(t.Integer({ minimum: 1 })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      }),
      response: {
        200: successSchema(t.Array(t.Any()))
      },
      detail: { summary: "Get current user's wishlist" }
    }
  )

  .post(
    '/items',
    async ({ body, set, user }) => {
      const wishlistItem = await wishlistService.addToWishlist(user!.sub, body.productId);
      set.status = 201;
      return successResponse(wishlistItem, 'Item added to wishlist successfully', 201);
    },
    {
      body: t.Object({
        productId: t.String({ format: 'uuid' })
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Add product to wishlist' }
    }
  )

  .post(
    '/toggle',
    async ({ body, user }) => {
      const result = await wishlistService.toggle(user!.sub, body.productId);
      return successResponse(result, result.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    },
    {
      body: t.Object({
        productId: t.String({ format: 'uuid' })
      }),
      response: { 200: successSchema(), 409: errorSchema },
      detail: { summary: 'Toggle a product in the wishlist' }
    }
  )

  .get(
    '/check/:productId',
    async ({ params, user }) => {
      const inWishlist = await wishlistService.hasProduct(user!.sub, params.productId);
      return successResponse({ inWishlist }, 'Wishlist status retrieved successfully');
    },
    {
      params: t.Object({ productId: t.String({ format: 'uuid' }) }),
      response: { 200: successSchema() },
      detail: { summary: 'Check whether a product is in the wishlist' }
    }
  )

  .delete(
    '/items/:id',
    async ({ params, user }) => {
      await wishlistService.removeItem(user!.sub, params.id);
      return successResponse(null, 'Item removed from wishlist successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: {
        200: successSchema(t.Null()),
        404: errorSchema
      },
      detail: { summary: 'Remove item from wishlist' }
    }
  )

  .get(
    '/count',
    async ({ user }) => {
      const count = await wishlistService.getWishlistCount(user!.sub);
      return successResponse({ count }, 'Wishlist count retrieved successfully');
    },
    {
      response: {
        200: successSchema(t.Object({
          count: t.Number()
        }))
      },
      detail: { summary: 'Get total wishlist count' }
    }
  );

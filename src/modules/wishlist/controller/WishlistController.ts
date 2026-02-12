import { Elysia, t } from 'elysia';
import { WishlistService } from '../service/WishlistService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const wishlistService = new WishlistService();

export const wishlistController = new Elysia({ prefix: '/wishlist', tags: ['Wishlist'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  // Get user's wishlist
  .get(
    '/',
    async ({ user }) => {
      const wishlist = await wishlistService.getWishlistForUser(user!.sub as string);
      return successResponse(wishlist, 'Wishlist retrieved successfully');
    },
    {
      response: {
        200: successSchema(t.Array(t.Any()))
      },
      detail: { summary: "Get current user's wishlist" }
    }
  )

  // Add item to wishlist
  .post(
    '/items',
    async ({ body, set, user }) => {
      const wishlistItem = await wishlistService.addToWishlist(user!.sub as string, body.productId);
      set.status = 201;
      return successResponse(wishlistItem, 'Item added to wishlist successfully', 201);
    },
    {
      body: t.Object({
        productId: t.String()
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Add product to wishlist' }
    }
  )

  // Remove item from wishlist
  .delete(
    '/items/:id',
    async ({ params }) => {
      await wishlistService.delete(params.id);
      return successResponse(null, 'Item removed from wishlist successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(t.Null()),
        404: errorSchema
      },
      detail: { summary: 'Remove item from wishlist' }
    }
  )

  // Get wishlist count for user
  .get(
    '/count',
    async ({ user }) => {
      const wishlist = await wishlistService.getWishlistForUser(user!.sub as string);
      return successResponse({ count: wishlist.length }, 'Wishlist count retrieved successfully');
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

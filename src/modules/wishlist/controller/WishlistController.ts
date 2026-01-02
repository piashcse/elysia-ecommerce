import { Elysia, t } from 'elysia';
import { WishlistService } from '../service/WishlistService';
import { addToWishlistSchema, wishlistIdSchema } from '../validators/WishlistValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, successResponse } from '../../../core/responses';
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
        200: t.Any()
      },
      detail: { summary: "Get current user's wishlist" }
    }
  )

  // Add item to wishlist
  .post(
    '/items',
    async ({ body, set, user }) => {
      const validatedData = validate(addToWishlistSchema, body);
      const wishlistItem = await wishlistService.addToWishlist(user!.sub as string, validatedData.productId);
      set.status = 201;
      return successResponse(wishlistItem, 'Item added to wishlist successfully', 201);
    },
    {
      body: t.Object({
        productId: t.String()
      }),
      response: {
        201: t.Any(),
        400: t.Any(),
        422: t.Any()
      },
      detail: { summary: 'Add product to wishlist' }
    }
  )

  // Remove item from wishlist
  .delete(
    '/items/:id',
    async ({ params }) => {
      const { id } = params;
      validate(wishlistIdSchema, { id });
      await wishlistService.removeFromWishlist(id);
      return successResponse(null, 'Item removed from wishlist successfully');
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Remove item from wishlist' }
    }
  )

  // Get wishlist count for user
  .get(
    '/count',
    async ({ user }) => {
      const count = await wishlistService.getWishlistCountForUser(user!.sub as string);
      return successResponse({ count }, 'Wishlist count retrieved successfully');
    },
    {
      response: {
        200: t.Any()
      },
      detail: { summary: 'Get total wishlist count' }
    }
  );
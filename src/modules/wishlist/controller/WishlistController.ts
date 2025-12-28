import {Elysia, t} from 'elysia';
import {WishlistService} from '../service/WishlistService';
import {addToWishlistSchema, wishlistIdSchema} from '../validators/WishlistValidator';
import {validate} from '../../../utils/validation';
import {errorResponse, successResponse} from '../../../core/responses';
import {authPlugin} from '../../../core/auth';

const wishlistService = new WishlistService();

export const wishlistController = new Elysia({ prefix: '/wishlist', tags: ['Wishlist'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  // Get user's wishlist
  .get(
    '/',
    async ({ user, set }) => {
      try {
        const wishlist = await wishlistService.getWishlistForUser(user!.sub as string);
        return successResponse(wishlist, 'Wishlist retrieved successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { summary: "Get current user's wishlist" }
    }
  )

  // Add item to wishlist
  .post(
    '/items',
    async ({ body, set, user }) => {
      try {
        const validatedData = validate(addToWishlistSchema, body);
        const wishlistItem = await wishlistService.addToWishlist(user!.sub as string, validatedData.productId);
        set.status = 201;
        return successResponse(wishlistItem, 'Item added to wishlist successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        productId: t.String()
      }),
      detail: { summary: 'Add product to wishlist' }
    }
  )

  // Remove item from wishlist
  .delete(
    '/items/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        validate(wishlistIdSchema, { id });
        await wishlistService.removeFromWishlist(id);
        return successResponse(null, 'Item removed from wishlist successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Remove item from wishlist' }
    }
  )

  // Get wishlist count for user
  .get(
    '/count',
    async ({ user, set }) => {
      try {
        const count = await wishlistService.getWishlistCountForUser(user!.sub as string);
        return successResponse({ count }, 'Wishlist count retrieved successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { summary: 'Get total wishlist count' }
    }
  );
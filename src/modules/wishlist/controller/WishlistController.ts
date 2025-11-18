import { Elysia, t } from 'elysia';
import { WishlistService } from '../service/WishlistService';
import { 
  addToWishlistSchema,
  wishlistIdSchema,
  productIdSchema
} from '../validators/WishlistValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse } from '../../../core/responses';
import { NotFoundError, UnauthorizedError, ConflictError } from '../../../core/errors';
import { isAuthenticated } from '../../../utils/jwt';

const wishlistService = new WishlistService();

export const wishlistController = new Elysia({ prefix: '/wishlist', tags: ['Wishlist'] })
  // Get user's wishlist
  .get(
    '/',
    async ({ set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }

        const wishlist = await wishlistService.getWishlistForUser(jwt.sub);

        return successResponse(wishlist, 'Wishlist retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { tags: ['Wishlist'] }
    }
  )
  
  // Add item to wishlist
  .post(
    '/items',
    async ({ body, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const validatedData = validate(addToWishlistSchema, body);
        const wishlistItem = await wishlistService.addToWishlist(jwt.sub, validatedData.productId);
        
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
      detail: { tags: ['Wishlist'] }
    }
  )
  
  // Remove item from wishlist
  .delete(
    '/items/:id',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const { id } = params;
        validate(wishlistIdSchema, { id });
        
        await wishlistService.removeFromWishlist(id);
        
        return successResponse(null, 'Item removed from wishlist successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['Wishlist'] }
    }
  )

  // Remove item from wishlist by product ID
  .delete(
    '/products/:id',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const { id } = params;
        validate(productIdSchema, { id });
        
        await wishlistService.removeByUserAndProduct(jwt.sub, id);
        
        return successResponse(null, 'Item removed from wishlist successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['Wishlist'] }
    }
  )

  // Check if product is in user's wishlist
  .get(
    '/products/:id',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const { id } = params;
        validate(productIdSchema, { id });
        
        const isInWishlist = await wishlistService.isProductInWishlist(jwt.sub, id);
        
        return successResponse({ isInWishlist }, 'Wishlist status retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['Wishlist'] }
    }
  )

  // Get wishlist count for user
  .get(
    '/count',
    async ({ set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const count = await wishlistService.getWishlistCountForUser(jwt.sub);
        
        return successResponse({ count }, 'Wishlist count retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { tags: ['Wishlist'] }
    }
  );
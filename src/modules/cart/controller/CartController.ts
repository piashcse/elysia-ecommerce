import { Elysia, t } from 'elysia';
import { CartService } from '../service/CartService';
import { 
  addToCartSchema,
  updateCartItemSchema,
  cartIdSchema,
  cartItemIdSchema,
  productIdSchema
} from '../validators/CartValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse } from '../../../core/responses';
import { NotFoundError, UnauthorizedError } from '../../../core/errors';
import { isAuthenticated } from '../../../utils/jwt';

const cartService = new CartService();

export const cartController = new Elysia({ prefix: '/cart' })
  // Get user's cart
  .get(
    '/',
    async ({ set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const cart = await cartService.getCartForUser(jwt.sub);
        
        if (!cart) {
          return successResponse(null, 'Cart is empty');
        }
        
        return successResponse(cart, 'Cart retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    }
  )
  
  // Add item to cart
  .post(
    '/items',
    async ({ body, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const validatedData = validate(addToCartSchema, body);
        const cart = await cartService.addToCart(jwt.sub, validatedData);
        
        return successResponse(cart, 'Item added to cart successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        productId: t.String(),
        quantity: t.Number()
      })
    }
  )
  
  // Update cart item quantity
  .put(
    '/items/:id',
    async ({ params, body, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const { id } = params;
        validate(cartItemIdSchema, { id });
        const validatedData = validate(updateCartItemSchema, body);
        
        const cart = await cartService.updateCartItem(id, validatedData);
        
        return successResponse(cart, 'Cart item updated successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        quantity: t.Number()
      })
    }
  )
  
  // Remove item from cart
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
        validate(cartItemIdSchema, { id });
        
        const cart = await cartService.removeCartItem(id);
        
        return successResponse(cart, 'Item removed from cart successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )
  
  // Clear entire cart
  .delete(
    '/',
    async ({ set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const cart = await cartService.getCartForUser(jwt.sub);
        
        if (!cart) {
          return successResponse(null, 'Cart is already empty', 200);
        }
        
        await cartService.clearCart(cart.id);
        
        return successResponse(null, 'Cart cleared successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    }
  );
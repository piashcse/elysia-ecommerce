import { Elysia, t } from 'elysia';
import { OrderService } from '../service/OrderService';
import { 
  createOrderSchema,
  updateOrderSchema,
  orderIdSchema,
  orderFilterSchema
} from '../validators/OrderValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { NotFoundError, UnauthorizedError, ConflictError } from '../../../core/errors';
import { isAuthenticated, hasRole } from '../../../utils/jwt';

const orderService = new OrderService();

export const orderController = new Elysia({ prefix: '/orders', tags: ['Order'] })
  // Create a new order
  .post(
    '/',
    async ({ body, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }

        const validatedData = validate(createOrderSchema, body);
        const order = await orderService.createOrder(jwt.sub, validatedData);

        set.status = 201;
        return successResponse(order, 'Order created successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            productId: t.String(),
            quantity: t.Number()
          })
        ),
        shippingAddress: t.Object({
          firstName: t.String(),
          lastName: t.String(),
          address: t.String(),
          city: t.String(),
          state: t.String(),
          zipCode: t.String(),
          country: t.String()
        }),
        billingAddress: t.Optional(t.Object({
          firstName: t.String(),
          lastName: t.String(),
          address: t.String(),
          city: t.String(),
          state: t.String(),
          zipCode: t.String(),
          country: t.String()
        })),
        notes: t.Optional(t.String())
      }),
      detail: { tags: ['Order'] }
    }
  )
  
  // Get all orders (admin only) or user's orders
  .get(
    '/',
    async ({ query, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        // Check if user has admin role to view all orders
        const isAdmin = jwt.role === 'admin';
        
        // Parse and validate query parameters
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        
        const filters = {
          status: query.status as string,
          dateFrom: query.dateFrom as string,
          dateTo: query.dateTo as string,
          userId: isAdmin ? (query.userId as string) : jwt.sub,
        };
        
        // If not admin, only allow viewing user's own orders
        if (!isAdmin) {
          filters.userId = jwt.sub;
        }
        
        const { orders, total } = await orderService.getOrders(page, limit, filters);
        
        return paginatedResponse(
          orders,
          {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          'Orders retrieved successfully'
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(t.String()),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
      detail: { tags: ['Order'] }
    }
  )
  
  // Get order by ID
  .get(
    '/:id',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const { id } = params;
        validate(orderIdSchema, { id });
        
        const order = await orderService.getOrderById(id);
        
        if (!order) {
          set.status = 404;
          return errorResponse('Order not found');
        }
        
        // Check if user is admin or owner of order
        if (jwt.role !== 'admin' && order.user.id !== jwt.sub) {
          set.status = 403;
          return errorResponse('Access denied. You can only view your own orders.');
        }
        
        return successResponse(order, 'Order retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['Order'] }
    }
  )

  // Update order (admin only)
  .put(
    '/:id',
    async ({ params, body, set, jwt }) => {
      try {
        // Check if user is authenticated and has admin role
        if (!jwt || jwt.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }
        
        const { id } = params;
        validate(orderIdSchema, { id });
        const validatedData = validate(updateOrderSchema, body);
        
        const order = await orderService.updateOrder(id, validatedData);
        
        return successResponse(order, 'Order updated successfully', 200);
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
        status: t.Optional(t.String()),
        notes: t.Optional(t.String())
      }),
      detail: { tags: ['Order'] }
    }
  )
  
  // Cancel order
  .put(
    '/:id/cancel',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const { id } = params;
        validate(orderIdSchema, { id });
        
        const order = await orderService.getOrderById(id);
        
        if (!order) {
          set.status = 404;
          return errorResponse('Order not found');
        }
        
        // Check if user is admin or owner of order
        if (jwt.role !== 'admin' && order.user.id !== jwt.sub) {
          set.status = 403;
          return errorResponse('Access denied. You can only cancel your own orders.');
        }
        
        const cancelledOrder = await orderService.cancelOrder(id);
        
        return successResponse(cancelledOrder, 'Order cancelled successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['Order'] }
    }
  )
  
  // Get user's order statistics
  .get(
    '/stats',
    async ({ set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }

        // Check if user has admin role to view overall stats
        const isAdmin = jwt.role === 'admin';
        const userId = isAdmin ? undefined : jwt.sub;

        const stats = await orderService.getOrderStats(userId);

        return successResponse(stats, 'Order statistics retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { tags: ['Order'] }
    }
  );
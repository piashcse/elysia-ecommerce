import { Elysia, t } from 'elysia';
import { OrderService } from '../service/OrderService';
import {
  createOrderSchema,
  updateOrderSchema,
  orderIdSchema
} from '../validators/OrderValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { jwt } from '@elysiajs/jwt';
import envConfig from '../../../config/env';
import { JwtPayload } from '../../../utils/jwt';

const orderService = new OrderService();

export const orderController = new Elysia({ prefix: '/orders', tags: ['Order'] })
  .use(
    jwt({
      name: 'jwt',
      secret: envConfig.JWT_SECRET,
    })
  )
  .derive(async ({ jwt, headers }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null };
    }
    const token = authHeader.split(' ')[1];
    const payload = await jwt.verify(token);
    if (!payload) return { user: null };
    return { user: payload as unknown as JwtPayload };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }
    return;
  })
  // Create a new order
  .post(
    '/',
    async ({ body, set, user }) => {
      try {
        const validatedData = validate(createOrderSchema, body);
        const order = await orderService.createOrder(user?.sub as string, validatedData);
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
      detail: { summary: 'Place a new order' }
    }
  )

  // Get all orders (admin only) or user's orders
  .get(
    '/',
    async ({ query, set, user }) => {
      try {
        const isAdmin = user?.role === 'admin';
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;

        const filters = {
          status: query.status as string,
          dateFrom: query.dateFrom as string,
          dateTo: query.dateTo as string,
          userId: isAdmin ? (query.userId as string) : (user?.sub as string),
        };

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
      detail: { summary: 'Get orders (Admin: all, Customer: own)' }
    }
  )

  // Get order by ID
  .get(
    '/:id',
    async ({ params, set, user }) => {
      try {
        const { id } = params;
        validate(orderIdSchema, { id });

        const order = await orderService.getOrderById(id);
        if (!order) {
          set.status = 404;
          return errorResponse('Order not found', 'NOT_FOUND', 404);
        }

        // Check if user is admin or owner of order
        if (user?.role !== 'admin' && order.userId !== user?.sub) {
          set.status = 403;
          return errorResponse('Access denied. You can only view your own orders.', 'FORBIDDEN', 403);
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
      detail: { summary: 'Get order details by ID' }
    }
  )

  // Update order (admin only)
  .put(
    '/:id',
    async ({ params, body, set, user }) => {
      try {
        if (user?.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
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
      detail: { summary: 'Update order status (Admin only)' }
    }
  )

  // Cancel order
  .put(
    '/:id/cancel',
    async ({ params, set, user }) => {
      try {
        const { id } = params;
        validate(orderIdSchema, { id });

        const order = await orderService.getOrderById(id);
        if (!order) {
          set.status = 404;
          return errorResponse('Order not found', 'NOT_FOUND', 404);
        }

        // Check if user is admin or owner of order
        if (user?.role !== 'admin' && order.userId !== user?.sub) {
          set.status = 403;
          return errorResponse('Access denied. You can only cancel your own orders.', 'FORBIDDEN', 403);
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
      detail: { summary: 'Cancel order' }
    }
  );
import { Elysia, t } from 'elysia';
import { OrderService } from '../service/OrderService';
import { errorResponse, paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { NotFoundError } from '../../../core/errors';

const orderService = new OrderService();

export const orderController = new Elysia({ prefix: '/orders', tags: ['Order'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  // Create a new order
  .post(
    '/',
    async ({ body, set, user }) => {
      const order = await orderService.createOrder(user!.sub as string, body);
      set.status = 201;
      return successResponse(order, 'Order created successfully', 201);
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            productId: t.String(),
            quantity: t.Number({ minimum: 1 })
          })
        ),
        shippingAddress: t.Object({
          firstName: t.String({ minLength: 1 }),
          lastName: t.String({ minLength: 1 }),
          address: t.String({ minLength: 1 }),
          city: t.String({ minLength: 1 }),
          state: t.String({ minLength: 1 }),
          zipCode: t.String({ minLength: 1 }),
          country: t.String({ minLength: 1 })
        }),
        billingAddress: t.Optional(t.Object({
          firstName: t.String({ minLength: 1 }),
          lastName: t.String({ minLength: 1 }),
          address: t.String({ minLength: 1 }),
          city: t.String({ minLength: 1 }),
          state: t.String({ minLength: 1 }),
          zipCode: t.String({ minLength: 1 }),
          country: t.String({ minLength: 1 })
        })),
        notes: t.Optional(t.String())
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Place a new order' }
    }
  )

  // Get all orders (admin only) or user's orders
  .get(
    '/',
    async ({ query, user }) => {
      const isAdmin = user?.role === UserRole.ADMIN;
      const page = query.page || 1;
      const limit = query.limit || 10;

      const filters = {
        status: query.status,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        userId: isAdmin ? query.userId : (user!.sub as string),
      };

      const { items, total } = await orderService.getOrders(page, limit, filters);

      return paginatedResponse(items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, 'Orders retrieved successfully');
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
        status: t.Optional(t.String()),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
      response: { 200: paginatedSchema() },
      detail: { summary: 'Get orders (Admin: all, Customer: own)' }
    }
  )

  // Get order by ID
  .get(
    '/:id',
    async ({ params, set, user }) => {
      const order = await orderService.getOrderById(params.id);
      if (!order) throw new NotFoundError('Order not found');

      // Check if user is admin or owner of order
      if (user?.role !== UserRole.ADMIN && order.userId !== user?.sub) {
        set.status = 403;
        return errorResponse('Access denied. You can only view your own orders.', 'FORBIDDEN', 403);
      }

      return successResponse(order, 'Order retrieved successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(),
        403: errorSchema,
        404: errorSchema
      },
      detail: { summary: 'Get order details by ID' }
    }
  )

  // Update order (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const order = await orderService.updateOrder(params.id, body);
      return successResponse(order, 'Order updated successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        status: t.Optional(t.String()),
        notes: t.Optional(t.String())
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Update order status (Admin only)' }
    }
  )

  // Cancel order
  .put(
    '/:id/cancel',
    async ({ params, set, user }) => {
      const order = await orderService.getOrderById(params.id);
      if (!order) throw new NotFoundError('Order not found');

      // Check if user is admin or owner of order
      if (user?.role !== UserRole.ADMIN && order.userId !== user?.sub) {
        set.status = 403;
        return errorResponse('Access denied. You can only cancel your own orders.', 'FORBIDDEN', 403);
      }

      const cancelledOrder = await orderService.cancelOrder(params.id);
      return successResponse(cancelledOrder, 'Order cancelled successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(),
        403: errorSchema,
        404: errorSchema
      },
      detail: { summary: 'Cancel order' }
    }
  );

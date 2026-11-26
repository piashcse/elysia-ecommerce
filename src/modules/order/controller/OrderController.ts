import { Elysia, t } from 'elysia';
import { OrderService } from '../service/OrderService';
import { errorResponse, paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { ForbiddenError, NotFoundError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';
import { orderStatuses, OrderStatus } from '../validators/OrderValidator';

const orderService = new OrderService();

const addressSchema = t.Object({
  firstName: t.String({ minLength: 1, maxLength: 100 }),
  lastName: t.String({ minLength: 1, maxLength: 100 }),
  address: t.String({ minLength: 1, maxLength: 500 }),
  city: t.String({ minLength: 1, maxLength: 100 }),
  state: t.String({ minLength: 1, maxLength: 100 }),
  zipCode: t.String({ minLength: 1, maxLength: 20 }),
  country: t.String({ minLength: 1, maxLength: 100 }),
  phone: t.Optional(t.String({ maxLength: 20 })),
});

const orderStatusSchema = t.Union([
  t.Literal('pending'),
  t.Literal('processing'),
  t.Literal('shipped'),
  t.Literal('delivered'),
  t.Literal('cancelled'),
  t.Literal('refunded'),
]);

export const orderController = new Elysia({ prefix: '/orders', tags: ['Order'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  .post(
    '/',
    async ({ body, set, user }) => {
      const order = await orderService.createOrder(user!.sub as string, body as any);
      set.status = 201;
      return successResponse(order, 'Order created successfully', 201);
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            productId: t.String({ format: 'uuid' }),
            quantity: t.Integer({ minimum: 1, maximum: 100 })
          }),
          { minItems: 1, maxItems: 50 }
        ),
        shippingAddress: addressSchema,
        billingAddress: t.Optional(addressSchema),
        notes: t.Optional(t.String({ maxLength: 1000 })),
        couponCode: t.Optional(t.String({ maxLength: 50 })),
        shippingMethodId: t.Optional(t.String({ format: 'uuid' })),
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Place a new order' }
    }
  )

  // Admin order statistics
  .get(
    '/stats',
    async () => {
      const stats = await orderService.getOrderStats();
      return successResponse(stats, 'Order statistics retrieved successfully');
    },
    {
      hasRole: UserRole.ADMIN,
      response: { 200: successSchema() },
      detail: { summary: 'Get order statistics (Admin only)' }
    }
  )

  // Get all orders (admin only) or user's orders
  .get(
    '/',
    async ({ query, user }) => {
      const isAdmin = user?.role === UserRole.ADMIN;
      const { page, limit } = getPagination(query);

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
        page: t.Optional(t.Integer({ minimum: 1 })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        status: t.Optional(orderStatusSchema),
        dateFrom: t.Optional(t.String({ format: 'date-time' })),
        dateTo: t.Optional(t.String({ format: 'date-time' })),
        userId: t.Optional(t.String({ format: 'uuid' })),
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

      if (user?.role !== UserRole.ADMIN && order.userId !== user?.sub) {
        throw new ForbiddenError('You can only view your own orders');
      }

      return successResponse(order, 'Order retrieved successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
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
      const order = await orderService.updateOrder(params.id, body as any);
      return successResponse(order, 'Order updated successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        status: t.Optional(orderStatusSchema),
        notes: t.Optional(t.String({ maxLength: 1000 })),
        trackingNumber: t.Optional(t.String({ maxLength: 100 })),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema,
        409: errorSchema
      },
      detail: { summary: 'Update order status (Admin only)' }
    }
  )

  // Cancel order
  .put(
    '/:id/cancel',
    async ({ params, set, user }) => {
      const order = await orderService.getOrderById(params.id);
      if (!order) throw new NotFoundError('Order not found');

      if (user?.role !== UserRole.ADMIN && order.userId !== user?.sub) {
        throw new ForbiddenError('You can only cancel your own orders');
      }

      await orderService.cancelOrder(params.id);
      const cancelledOrder = await orderService.getOrderById(params.id);
      return successResponse(cancelledOrder, 'Order cancelled successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: {
        200: successSchema(),
        403: errorSchema,
        404: errorSchema,
        409: errorSchema
      },
      detail: { summary: 'Cancel order' }
    }
  );

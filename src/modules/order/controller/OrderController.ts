import { Elysia, t } from 'elysia';
import { OrderService } from '../service/OrderService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams, uuid } from '../../../core/schemas';
import { UserRole } from '../../../core/roles';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../core/errors';
import { AddressService } from '../../address/service/AddressService';
import { ORDER_STATUSES, PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';
import { IdempotencyService } from '../../../core/idempotency.service';
import { canAccessOrder } from '../order-access';

const orderService = new OrderService();
const addressService = new AddressService();
const idempotency = new IdempotencyService();

const toOrderAddress = (address: any) => ({
  firstName: address.fullName.split(' ')[0] || address.fullName,
  lastName: address.fullName.split(' ').slice(1).join(' ') || '-',
  address: [address.addressLine1, address.addressLine2].filter(Boolean).join(', '),
  city: address.city,
  state: address.state,
  zipCode: address.postalCode,
  country: address.country,
  phone: address.phoneNumber,
});

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

const orderStatusSchema = t.Union(ORDER_STATUSES.map((status) => t.Literal(status)));

export const orderController = new Elysia({ prefix: '/orders', tags: ['Order'] })
  .use(authPlugin)
  .post('/', {
    body: t.Object({
      items: t.Array(
        t.Object({
          productId: uuid,
          variantId: t.Optional(uuid),
          quantity: t.Integer({ minimum: 1, maximum: 100 })
        }),
        { minItems: 1, maxItems: 50 }
      ),
      shippingAddress: t.Optional(addressSchema),
      shippingAddressId: t.Optional(uuid),
      billingAddress: t.Optional(addressSchema),
      billingAddressId: t.Optional(uuid),
      notes: t.Optional(t.String({ maxLength: 1000 })),
      couponCode: t.Optional(t.String({ maxLength: 50 })),
      shippingMethodId: t.Optional(uuid),
      email: t.Optional(t.String({ format: 'email', maxLength: 255 })),
    }),
    response: {
      201: successSchema(),
      400: errorSchema,
      409: errorSchema,
      422: errorSchema
    },
    detail: { summary: 'Place a new order' }
  }, async ({ body, set, user, headers }) => {
    const idempotencyKey = headers['idempotency-key'];
    if (typeof idempotencyKey === 'string' && idempotencyKey.length > 0) {
      const existing = await idempotency.get(idempotencyKey, 'order:create');
      if (existing) {
        set.status = existing.statusCode;
        return existing.response;
      }
    }

    let shippingAddress = body.shippingAddress;
    if (!shippingAddress && body.shippingAddressId) {
      if (!user) throw new ValidationError('Saved addresses require an account');
      const saved = await addressService.getAddressById(body.shippingAddressId, user.sub);
      if (!saved) throw new NotFoundError('Shipping address not found');
      shippingAddress = toOrderAddress(saved);
    }

    if (!shippingAddress) {
      throw new ValidationError('shippingAddress or shippingAddressId is required');
    }

    let billingAddress = body.billingAddress;
    if (!billingAddress && body.billingAddressId) {
      if (!user) throw new ValidationError('Saved addresses require an account');
      const saved = await addressService.getAddressById(body.billingAddressId, user.sub);
      if (!saved) throw new NotFoundError('Billing address not found');
      billingAddress = toOrderAddress(saved);
    }

    const email = user?.email ?? body.email;
    if (!email) throw new ValidationError('Email is required for guest checkout');

    const order = await orderService.createOrder(user?.sub ?? null, email, {
      ...body,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
    } as any);

    const response = successResponse(order, 'Order created successfully', 201);
    if (typeof idempotencyKey === 'string' && idempotencyKey.length > 0) {
      await idempotency.save(idempotencyKey, 'order:create', 201, response, user?.sub);
    }

    set.status = 201;
    return response;
  })

  // Admin order statistics
  .get('/stats', {
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema() },
    detail: { summary: 'Get order statistics (Admin only)' }
  }, async () => {
    const stats = await orderService.getOrderStats();
    return successResponse(stats, 'Order statistics retrieved successfully');
  })

  // Get all orders (admin only) or user's orders
  .get('/', {
    isAuth: true,
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      status: t.Optional(orderStatusSchema),
      dateFrom: t.Optional(t.String({ format: 'date-time' })),
      dateTo: t.Optional(t.String({ format: 'date-time' })),
      userId: t.Optional(uuid),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'Get orders (Admin: all, Customer: own)' }
  }, async ({ query, user }) => {
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
  })

  // Get order by ID
  .get('/:id', {
    params: idParams,
    query: t.Object({ guestToken: t.Optional(t.String({ maxLength: 128 })) }),
    response: {
      200: successSchema(),
      403: errorSchema,
      404: errorSchema
    },
    detail: { summary: 'Get order details by ID' }
  }, async ({ params, user, query }) => {
    const order = await orderService.getOrderById(params.id);
    if (!order) throw new NotFoundError('Order not found');
    if (!canAccessOrder(order, user, query.guestToken)) {
      throw new ForbiddenError('You can only view your own orders');
    }
    return successResponse(order, 'Order retrieved successfully');
  })

  .get('/:id/events', {
    params: idParams,
    query: t.Object({ guestToken: t.Optional(t.String({ maxLength: 128 })) }),
    response: { 200: successSchema(), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Get the order timeline' }
  }, async ({ params, user, query }) => {
    const order = await orderService.getOrderById(params.id);
    if (!order) throw new NotFoundError('Order not found');
    if (!canAccessOrder(order, user, query.guestToken)) {
      throw new ForbiddenError('You can only view your own orders');
    }
    const events = await orderService.getOrderEvents(params.id);
    return successResponse(events, 'Order events retrieved successfully');
  })

  .post('/release-expired', {
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema() },
    detail: { summary: 'Release expired pending orders (Admin only)' }
  }, async () => {
    const released = await orderService.releaseExpiredOrders();
    return successResponse({ released }, 'Expired orders released successfully');
  })

  // Update order (admin only)
  .put('/:id', {
    params: idParams,
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
  }, async ({ params, body }) => {
    const order = await orderService.updateOrder(params.id, body as any);
    return successResponse(order, 'Order updated successfully');
  })

  // Cancel order
  .put('/:id/cancel', {
    params: idParams,
    query: t.Object({ guestToken: t.Optional(t.String({ maxLength: 128 })) }),
    response: {
      200: successSchema(),
      403: errorSchema,
      404: errorSchema,
      409: errorSchema
    },
    detail: { summary: 'Cancel order' }
  }, async ({ params, user, query }) => {
    const order = await orderService.getOrderById(params.id);
    if (!order) throw new NotFoundError('Order not found');
    if (!canAccessOrder(order, user, query.guestToken)) {
      throw new ForbiddenError('You can only cancel your own orders');
    }
    await orderService.cancelOrder(params.id);
    const cancelledOrder = await orderService.getOrderById(params.id);
    return successResponse(cancelledOrder, 'Order cancelled successfully');
  });

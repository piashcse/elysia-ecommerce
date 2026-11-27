import { Elysia, t } from 'elysia';
import { ShippingService } from '../service/ShippingService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams, uuid } from '../../../core/schemas';
import { UserRole } from '../../../core/roles';
import { NotFoundError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const shippingService = new ShippingService();

export const shippingController = new Elysia({ prefix: '/shipping-methods', tags: ['Shipping'] })
  .use(authPlugin)
  .post('/', {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      description: t.Optional(t.String({ maxLength: 1000 })),
      baseCost: t.Number({ minimum: 0 }),
      costPerKg: t.Optional(t.Number({ minimum: 0 })),
      estimatedDaysMin: t.Integer({ minimum: 0 }),
      estimatedDaysMax: t.Integer({ minimum: 0 }),
      countries: t.Optional(t.Array(t.String({ minLength: 2, maxLength: 100 }))),
      freeShippingThreshold: t.Optional(t.Number({ minimum: 0 })),
      isActive: t.Optional(t.Boolean()),
    }),
    hasRole: UserRole.ADMIN,
    response: { 201: successSchema(), 400: errorSchema, 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Create a new shipping method (Admin only)' }
  }, async ({ body, set }) => {
    const shippingMethod = await shippingService.createShippingMethod(body as any);
    set.status = 201;
    return successResponse(shippingMethod, 'Shipping method created successfully', 201);
  })

  .post('/quote', {
    body: t.Object({
      items: t.Array(
        t.Object({
          productId: uuid,
          quantity: t.Integer({ minimum: 1, maximum: 100 }),
        }),
        { minItems: 1, maxItems: 50 }
      ),
      country: t.Optional(t.String({ maxLength: 100 })),
    }),
    response: { 200: successSchema(), 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Calculate shipping options for a cart' }
  }, async ({ body }) => {
    const quote = await shippingService.quote(body.items, body.country);
    return successResponse(quote, 'Shipping quote calculated successfully');
  })

  .get('/', {
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      isActive: t.Optional(t.Boolean()),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'Get all shipping methods' }
  }, async ({ query, user }) => {
    const { page, limit } = getPagination(query);
    const isAdmin = user?.role === UserRole.ADMIN;
    const activeFilter = isAdmin ? query.isActive : true;
  
    const { shippingMethods, total } = await shippingService.getAllShippingMethods(page, limit, {
      isActive: activeFilter,
    });
  
    return paginatedResponse(
      shippingMethods,
      { page, limit, total, totalPages: Math.ceil(total / limit) },
      'Shipping methods retrieved successfully'
    );
  })

  .get('/:id', {
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Get shipping method by ID' }
  }, async ({ params }) => {
    const shippingMethod = await shippingService.findShippingMethodById(params.id);
    if (!shippingMethod) throw new NotFoundError('Shipping method not found');
    return successResponse(shippingMethod, 'Shipping method retrieved successfully');
  })

  .put('/:id', {
    params: idParams,
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      description: t.Optional(t.String({ maxLength: 1000 })),
      baseCost: t.Optional(t.Number({ minimum: 0 })),
      costPerKg: t.Optional(t.Number({ minimum: 0 })),
      estimatedDaysMin: t.Optional(t.Integer({ minimum: 0 })),
      estimatedDaysMax: t.Optional(t.Integer({ minimum: 0 })),
      isActive: t.Optional(t.Boolean()),
    }),
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema(), 400: errorSchema, 404: errorSchema },
    detail: { summary: 'Update shipping method by ID (Admin only)' }
  }, async ({ params, body }) => {
    const updatedShippingMethod = await shippingService.updateShippingMethod(params.id, body as any);
    return successResponse(updatedShippingMethod, 'Shipping method updated successfully');
  })

  .delete('/:id', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema(t.Null()), 404: errorSchema },
    detail: { summary: 'Delete shipping method by ID (Admin only)' }
  }, async ({ params }) => {
    await shippingService.deleteShippingMethod(params.id);
    return successResponse(null, 'Shipping method deleted successfully');
  });

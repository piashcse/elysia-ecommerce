import { Elysia, t } from 'elysia';
import { ShippingService } from '../service/ShippingService';
import { errorResponse, paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const shippingService = new ShippingService();

export const shippingController = new Elysia({ prefix: '/shipping-methods', tags: ['Shipping'] })
  .use(authPlugin)

  // Create a new shipping method (admin only)
  .post(
    '/',
    async ({ body, set }) => {
      const shippingMethod = await shippingService.createShippingMethod(body);
      set.status = 201;
      return successResponse(shippingMethod, 'Shipping method created successfully', 201);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        baseCost: t.Numeric({ minimum: 0 }),
        costPerKg: t.Optional(t.Numeric({ minimum: 0 })),
        estimatedDaysMin: t.Numeric({ minimum: 0 }),
        estimatedDaysMax: t.Numeric({ minimum: 0 }),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 201: successSchema(), 400: errorSchema, 422: errorSchema },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Create a new shipping method (Admin only)' }
    }
  )

  // Get all shipping methods
  .get(
    '/',
    async ({ query }) => {
      const page = query.page || 1;
      const limit = query.limit || 10;

      const { shippingMethods, total } = await shippingService.getAllShippingMethods(page, limit);

      return paginatedResponse(
        shippingMethods,
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        'Shipping methods retrieved successfully'
      );
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      response: { 200: paginatedSchema() },
      detail: { summary: 'Get all shipping methods' }
    }
  )

  // Get shipping method by ID
  .get(
    '/:id',
    async ({ params }) => {
      const shippingMethod = await shippingService.findShippingMethodById(params.id);
      if (!shippingMethod) return errorResponse('Shipping method not found', 'NOT_FOUND', 404);

      return successResponse(shippingMethod, 'Shipping method retrieved successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: { 200: successSchema(), 404: errorSchema },
      detail: { summary: 'Get shipping method by ID' }
    }
  )

  // Update shipping method by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const updatedShippingMethod = await shippingService.updateShippingMethod(params.id, body);
      return successResponse(updatedShippingMethod, 'Shipping method updated successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        baseCost: t.Optional(t.Numeric({ minimum: 0 })),
        costPerKg: t.Optional(t.Numeric({ minimum: 0 })),
        estimatedDaysMin: t.Optional(t.Numeric({ minimum: 0 })),
        estimatedDaysMax: t.Optional(t.Numeric({ minimum: 0 })),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 200: successSchema(), 400: errorSchema, 404: errorSchema },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Update shipping method by ID (Admin only)' }
    }
  )

  // Delete shipping method by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      await shippingService.deleteShippingMethod(params.id);
      return successResponse(null, 'Shipping method deleted successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: { 200: successSchema(t.Null()), 404: errorSchema },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Delete shipping method by ID (Admin only)' }
    }
  );

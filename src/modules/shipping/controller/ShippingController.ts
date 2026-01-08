import { Elysia, t } from 'elysia';
import { ShippingService } from '../service/ShippingService';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
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
        baseCost: t.Number({ minimum: 0 }),
        costPerKg: t.Optional(t.Number({ minimum: 0 })),
        estimatedDaysMin: t.Number({ minimum: 0 }),
        estimatedDaysMax: t.Number({ minimum: 0 }),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 201: t.Any(), 400: t.Any(), 422: t.Any() },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Create a new shipping method (Admin only)' }
    }
  )

  // Get all shipping methods
  .get(
    '/',
    async ({ query }) => {
      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 10;

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
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      response: { 200: t.Any() },
      detail: { summary: 'Get all shipping methods' }
    }
  )

  // Get shipping method by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      const { id } = params;

      const shippingMethod = await shippingService.findShippingMethodById(id);
      if (!shippingMethod) {
        set.status = 404;
        return errorResponse('Shipping method not found', 'NOT_FOUND', 404);
      }

      return successResponse(shippingMethod, 'Shipping method retrieved successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: { 200: t.Any(), 404: t.Any() },
      detail: { summary: 'Get shipping method by ID' }
    }
  )

  // Update shipping method by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const { id } = params;
      const updatedShippingMethod = await shippingService.updateShippingMethod(id, body);

      return successResponse(updatedShippingMethod, 'Shipping method updated successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        baseCost: t.Optional(t.Number({ minimum: 0 })),
        costPerKg: t.Optional(t.Number({ minimum: 0 })),
        estimatedDaysMin: t.Optional(t.Number({ minimum: 0 })),
        estimatedDaysMax: t.Optional(t.Number({ minimum: 0 })),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 200: t.Any(), 400: t.Any(), 404: t.Any() },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Update shipping method by ID (Admin only)' }
    }
  )

  // Delete shipping method by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      const { id } = params;

      await shippingService.deleteShippingMethod(id);

      return successResponse(null, 'Shipping method deleted successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: { 200: t.Any(), 404: t.Any() },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Delete shipping method by ID (Admin only)' }
    }
  );

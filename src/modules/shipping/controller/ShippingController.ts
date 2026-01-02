import { Elysia, t } from 'elysia';
import { ShippingService } from '../service/ShippingService';
import {
  createShippingMethodSchema,
  shippingMethodIdSchema,
  updateShippingMethodSchema,
} from '../validators/ShippingValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const shippingService = new ShippingService();

export const shippingController = new Elysia({ prefix: '/shipping-methods', tags: ['Shipping'] })
  .use(authPlugin)
  // Create a new shipping method (admin only)
  .post(
    '/',
    async ({ body, set }) => {
      const validatedData = validate(createShippingMethodSchema, body);
      const shippingMethod = await shippingService.createShippingMethod(validatedData);

      set.status = 201;
      return successResponse(shippingMethod, 'Shipping method created successfully', 201);
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        baseCost: t.Number(),
        costPerKg: t.Optional(t.Number()),
        estimatedDaysMin: t.Number(),
        estimatedDaysMax: t.Number(),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 201: t.Any(), 400: t.Any(), 422: t.Any() },
      hasRole: 'admin',
      detail: { summary: 'Create a new shipping method (Admin only)' }
    }
  )

  // Get all shipping methods
  .get(
    '/',
    async ({ query }) => {
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;

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
      validate(shippingMethodIdSchema, { id });

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
      validate(shippingMethodIdSchema, { id });
      const validatedData = validate(updateShippingMethodSchema, body);

      const updatedShippingMethod = await shippingService.updateShippingMethod(id, validatedData);

      return successResponse(updatedShippingMethod, 'Shipping method updated successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        baseCost: t.Optional(t.Number()),
        costPerKg: t.Optional(t.Number()),
        estimatedDaysMin: t.Optional(t.Number()),
        estimatedDaysMax: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 200: t.Any(), 400: t.Any(), 404: t.Any() },
      hasRole: 'admin',
      detail: { summary: 'Update shipping method by ID (Admin only)' }
    }
  )

  // Delete shipping method by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      const { id } = params;
      validate(shippingMethodIdSchema, { id });

      await shippingService.deleteShippingMethod(id);

      return successResponse(null, 'Shipping method deleted successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: { 200: t.Any(), 404: t.Any() },
      hasRole: 'admin',
      detail: { summary: 'Delete shipping method by ID (Admin only)' }
    }
  );

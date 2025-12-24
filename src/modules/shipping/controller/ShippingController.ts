import { Elysia, t } from 'elysia';
import { ShippingService } from '../service/ShippingService';
import {
  createShippingMethodSchema,
  updateShippingMethodSchema,
  shippingMethodIdSchema,
} from '../validators/ShippingValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { jwt } from '@elysiajs/jwt';
import envConfig from '../../../config/env';

const shippingService = new ShippingService();

export const shippingController = new Elysia({ prefix: '/shipping-methods', tags: ['Shipping'] })
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
    return { user: payload };
  })
  // Create a new shipping method (admin only)
  .post(
    '/',
    async ({ body, set, user }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
        }

        const validatedData = validate(createShippingMethodSchema, body);
        const shippingMethod = await shippingService.createShippingMethod(validatedData);

        set.status = 201;
        return successResponse(shippingMethod, 'Shipping method created successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
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
      detail: { summary: 'Create a new shipping method (Admin only)' }
    }
  )

  // Get all shipping methods
  .get(
    '/',
    async ({ query, set }) => {
      try {
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
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { summary: 'Get all shipping methods' }
    }
  )

  // Get shipping method by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        validate(shippingMethodIdSchema, { id });

        const shippingMethod = await shippingService.findShippingMethodById(id);
        if (!shippingMethod) {
          set.status = 404;
          return errorResponse('Shipping method not found', 'NOT_FOUND', 404);
        }

        return successResponse(shippingMethod, 'Shipping method retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Get shipping method by ID' }
    }
  )

  // Update shipping method by ID (admin only)
  .put(
    '/:id',
    async ({ params, body, set, user }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
        }

        const { id } = params;
        validate(shippingMethodIdSchema, { id });
        const validatedData = validate(updateShippingMethodSchema, body);

        const updatedShippingMethod = await shippingService.updateShippingMethod(id, validatedData);

        return successResponse(updatedShippingMethod, 'Shipping method updated successfully', 200);
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
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        baseCost: t.Optional(t.Number()),
        costPerKg: t.Optional(t.Number()),
        estimatedDaysMin: t.Optional(t.Number()),
        estimatedDaysMax: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
      }),
      detail: { summary: 'Update shipping method by ID (Admin only)' }
    }
  )

  // Delete shipping method by ID (admin only)
  .delete(
    '/:id',
    async ({ params, set, user }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
        }

        const { id } = params;
        validate(shippingMethodIdSchema, { id });

        await shippingService.deleteShippingMethod(id);

        return successResponse(null, 'Shipping method deleted successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Delete shipping method by ID (Admin only)' }
    }
  );

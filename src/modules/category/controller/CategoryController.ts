import { Elysia, t } from 'elysia';
import { CategoryService } from '../service/CategoryService';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema
} from '../validators/CategoryValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { jwt } from '@elysiajs/jwt';
import envConfig from '../../../config/env';

const categoryService = new CategoryService();

export const categoryController = new Elysia({ prefix: '/categories', tags: ['Category'] })
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
  // Create a new category (admin only)
  .post(
    '/',
    async ({ body, set, user }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
        }

        const validatedData = validate(createCategorySchema, body);
        const category = await categoryService.createCategory(validatedData);

        set.status = 201;
        return successResponse(category, 'Category created successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      }),
      detail: { summary: 'Create a new category (Admin only)' }
    }
  )

  // Get all categories with filters and pagination
  .get(
    '/',
    async ({ query, set }) => {
      try {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;

        const filters = {
          search: query.search as string | undefined,
          isActive: query.isActive === 'true',
        };

        const { categories, total } = await categoryService.getAllCategories(page, limit, filters);

        return paginatedResponse(
          categories,
          {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          'Categories retrieved successfully'
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        isActive: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { summary: 'Get all categories' }
    }
  )

  // Get category by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        validate(categoryIdSchema, { id });

        const category = await categoryService.findCategoryById(id);
        if (!category) {
          set.status = 404;
          return errorResponse('Category not found', 'NOT_FOUND', 404);
        }

        return successResponse(category, 'Category retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Get category by ID' }
    }
  )

  // Update category by ID (admin only)
  .put(
    '/:id',
    async ({ params, body, set, user }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
        }

        const { id } = params;
        validate(categoryIdSchema, { id });
        const validatedData = validate(updateCategorySchema, body);

        const updatedCategory = await categoryService.updateCategory(id, validatedData);

        return successResponse(updatedCategory, 'Category updated successfully', 200);
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
      }),
      detail: { summary: 'Update category by ID (Admin only)' }
    }
  )

  // Delete category by ID (admin only)
  .delete(
    '/:id',
    async ({ params, set, user }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
        }

        const { id } = params;
        validate(categoryIdSchema, { id });

        await categoryService.deleteCategory(id);

        return successResponse(null, 'Category deleted successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Delete category by ID (Admin only)' }
    }
  );
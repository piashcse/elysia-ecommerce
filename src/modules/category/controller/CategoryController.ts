import { Elysia, t } from 'elysia';
import { CategoryService } from '../service/CategoryService';
import { categoryIdSchema, createCategorySchema, updateCategorySchema } from '../validators/CategoryValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const categoryService = new CategoryService();

export const categoryController = new Elysia({ prefix: '/categories', tags: ['Category'] })
  .use(authPlugin)
  // Create a new category (admin only)
  .post(
    '/',
    async ({ body, set }) => {
      const validatedData = validate(createCategorySchema, body);
      const category = await categoryService.createCategory(validatedData);

      set.status = 201;
      return successResponse(category, 'Category created successfully', 201);
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      }),
      response: {
        201: t.Any(),
        400: t.Any(),
        422: t.Any()
      },
      hasRole: 'admin',
      detail: { summary: 'Create a new category (Admin only)' }
    }
  )

  // Get all categories with filters and pagination
  .get(
    '/',
    async ({ query }) => {
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
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        isActive: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Any()
      },
      detail: { summary: 'Get all categories' }
    }
  )

  // Get category by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      const { id } = params;
      validate(categoryIdSchema, { id });

      const category = await categoryService.findCategoryById(id);
      if (!category) {
        set.status = 404;
        return errorResponse('Category not found', 'NOT_FOUND', 404);
      }

      return successResponse(category, 'Category retrieved successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Get category by ID' }
    }
  )

  // Update category by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const { id } = params;
      validate(categoryIdSchema, { id });
      const validatedData = validate(updateCategorySchema, body);

      const updatedCategory = await categoryService.updateCategory(id, validatedData);

      return successResponse(updatedCategory, 'Category updated successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
      response: {
        200: t.Any(),
        400: t.Any(),
        404: t.Any()
      },
      hasRole: 'admin',
      detail: { summary: 'Update category by ID (Admin only)' }
    }
  )

  // Delete category by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      const { id } = params;
      validate(categoryIdSchema, { id });

      await categoryService.deleteCategory(id);

      return successResponse(null, 'Category deleted successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      hasRole: 'admin',
      response: {
        200: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Delete category by ID (Admin only)' }
    }
  );
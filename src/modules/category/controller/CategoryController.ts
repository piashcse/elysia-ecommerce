import { Elysia, t } from 'elysia';
import { CategoryService } from '../service/CategoryService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const categoryService = new CategoryService();

export const categoryController = new Elysia({ prefix: '/categories', tags: ['Category'] })
  .use(authPlugin)
  // Create a new category (admin only)
  .post(
    '/',
    async ({ body, set }) => {
      const category = await categoryService.createCategory(body);
      set.status = 201;
      return successResponse(category, 'Category created successfully', 201);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Create a new category (Admin only)' }
    }
  )

  // Get all categories
  .get(
    '/',
    async ({ query }) => {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const filters = {
        search: query.search,
        isActive: query.isActive,
      };

      const { items, total } = await categoryService.findAll(page, limit);

      return paginatedResponse(items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, 'Categories retrieved successfully');
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
        search: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 200: paginatedSchema() },
      detail: { summary: 'Get all categories with pagination' }
    }
  )

  // Get category by ID
  .get(
    '/:id',
    async ({ params }) => {
      const category = await categoryService.findByIdOrFail(params.id, 'Category');
      return successResponse(category, 'Category retrieved successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Get category by ID' }
    }
  )

  // Update category by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const updatedCategory = await categoryService.updateCategory(params.id, body);
      return successResponse(updatedCategory, 'Category updated successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Update category by ID (Admin only)' }
    }
  )

  // Delete category by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      await categoryService.deleteCategory(params.id);
      return successResponse(null, 'Category deleted successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(t.Null()),
        404: errorSchema,
        400: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Delete category by ID (Admin only)' }
    }
  )

  // Get category with its products
  .get(
    '/:id/products',
    async ({ params, query }) => {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const result = await categoryService.getCategoryWithProducts(params.id, page, limit);

      return successResponse(result, 'Category products retrieved successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Get products in a specific category' }
    }
  );

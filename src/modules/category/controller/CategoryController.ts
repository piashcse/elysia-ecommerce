import { Elysia, t } from 'elysia';
import { CategoryService } from '../service/CategoryService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const categoryService = new CategoryService();

export const categoryController = new Elysia({ prefix: '/categories', tags: ['Category'] })
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set }) => {
      const category = await categoryService.createCategory(body as any);
      set.status = 201;
      return successResponse(category, 'Category created successfully', 201);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        description: t.Optional(t.String({ maxLength: 5000 })),
        imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
        isActive: t.Optional(t.Boolean()),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        201: successSchema(),
        400: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Create a new category (Admin only)' }
    }
  )

  .get(
    '/',
    async ({ query, user }) => {
      const { page, limit } = getPagination(query);
      const isAdmin = user?.role === UserRole.ADMIN;

      const { items, total } = await categoryService.getAllCategories(page, limit, {
        search: query.search,
        isActive: isAdmin ? query.isActive : true,
      });

      return paginatedResponse(items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, 'Categories retrieved successfully');
    },
    {
      query: t.Object({
        page: t.Optional(t.Integer({ minimum: 1 })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        search: t.Optional(t.String({ maxLength: 100 })),
        isActive: t.Optional(t.Boolean()),
      }),
      response: { 200: paginatedSchema() },
      detail: { summary: 'Get all categories with pagination' }
    }
  )

  .get(
    '/:id',
    async ({ params }) => {
      const category = await categoryService.findByIdOrFail(params.id, 'Category');
      return successResponse(category, 'Category retrieved successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Get category by ID' }
    }
  )

  .put(
    '/:id',
    async ({ params, body }) => {
      const updatedCategory = await categoryService.updateCategory(params.id, body as any);
      return successResponse(updatedCategory, 'Category updated successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        description: t.Optional(t.String({ maxLength: 5000 })),
        imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
        isActive: t.Optional(t.Boolean()),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Update category by ID (Admin only)' }
    }
  )

  .delete(
    '/:id',
    async ({ params }) => {
      await categoryService.deleteCategory(params.id);
      return successResponse(null, 'Category deleted successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      hasRole: UserRole.ADMIN,
      response: {
        200: successSchema(t.Null()),
        404: errorSchema,
        409: errorSchema
      },
      detail: { summary: 'Delete category by ID (Admin only)' }
    }
  )

  .get(
    '/:id/products',
    async ({ params, query, user }) => {
      const { page, limit } = getPagination(query);
      const isAdmin = user?.role === UserRole.ADMIN;

      const result = await categoryService.getCategoryWithProducts(params.id, page, limit, {
        isActive: isAdmin ? query.isActive : true,
      });

      return successResponse(result, 'Category products retrieved successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      query: t.Object({
        page: t.Optional(t.Integer({ minimum: 1 })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        isActive: t.Optional(t.Boolean()),
      }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Get products in a specific category' }
    }
  );

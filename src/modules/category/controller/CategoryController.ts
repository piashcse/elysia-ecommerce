import { Elysia, t } from 'elysia';
import { CategoryService } from '../service/CategoryService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams, uuid } from '../../../core/schemas';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const categoryService = new CategoryService();

export const categoryController = new Elysia({ prefix: '/categories', tags: ['Category'] })
  .use(authPlugin)
  .post('/', {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      description: t.Optional(t.String({ maxLength: 5000 })),
      imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
      parentId: t.Optional(uuid),
      slug: t.Optional(t.String({ maxLength: 120 })),
      metaTitle: t.Optional(t.String({ maxLength: 200 })),
      metaDescription: t.Optional(t.String({ maxLength: 500 })),
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
  }, async ({ body, set }) => {
    const category = await categoryService.createCategory(body as any);
    set.status = 201;
    return successResponse(category, 'Category created successfully', 201);
  })

  .get('/', {
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      search: t.Optional(t.String({ maxLength: 100 })),
      isActive: t.Optional(t.Boolean()),
      locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'Get all categories with pagination' }
  }, async ({ query, user }) => {
    const { page, limit } = getPagination(query);
    const isAdmin = user?.role === UserRole.ADMIN;
  
    const { items, total } = await categoryService.getAllCategories(page, limit, {
      search: query.search,
      isActive: isAdmin ? query.isActive : true,
      locale: query.locale,
    });
  
    return paginatedResponse(items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, 'Categories retrieved successfully');
  })

  .get('/tree', {
    query: t.Object({ locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })) }),
    response: { 200: successSchema() },
    detail: { summary: 'Get the category tree' }
  }, async ({ query }) => successResponse(await categoryService.getTree(query.locale), 'Category tree retrieved successfully'))
  .get('/slug/:slug', {
    params: t.Object({ slug: t.String({ maxLength: 120 }) }),
    query: t.Object({ locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })) }),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Get a category by slug' }
  }, async ({ params, query }) => successResponse(await categoryService.getBySlug(params.slug, query.locale), 'Category retrieved successfully'))
  .get('/:id', {
    params: idParams,
    query: t.Object({ locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })) }),
    response: {
      200: successSchema(),
      404: errorSchema
    },
    detail: { summary: 'Get category by ID' }
  }, async ({ params, query }) => {
    const category = await categoryService.getById(params.id, query.locale);
    return successResponse(category, 'Category retrieved successfully');
  })

  .put('/:id', {
    params: idParams,
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      description: t.Optional(t.String({ maxLength: 5000 })),
      imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
      parentId: t.Optional(uuid),
      slug: t.Optional(t.String({ maxLength: 120 })),
      metaTitle: t.Optional(t.String({ maxLength: 200 })),
      metaDescription: t.Optional(t.String({ maxLength: 500 })),
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
  }, async ({ params, body }) => {
    const updatedCategory = await categoryService.updateCategory(params.id, body as any);
    return successResponse(updatedCategory, 'Category updated successfully');
  })

  .delete('/:id', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: {
      200: successSchema(t.Null()),
      404: errorSchema,
      409: errorSchema
    },
    detail: { summary: 'Delete category by ID (Admin only)' }
  }, async ({ params }) => {
    await categoryService.deleteCategory(params.id);
    return successResponse(null, 'Category deleted successfully');
  })

  .get('/:id/products', {
    params: idParams,
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      isActive: t.Optional(t.Boolean()),
      locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })),
    }),
    response: {
      200: successSchema(),
      404: errorSchema
    },
    detail: { summary: 'Get products in a specific category' }
  }, async ({ params, query, user }) => {
    const { page, limit } = getPagination(query);
    const isAdmin = user?.role === UserRole.ADMIN;
  
    const result = await categoryService.getCategoryWithProducts(params.id, page, limit, {
      isActive: isAdmin ? query.isActive : true,
      locale: query.locale,
    });
  
    return successResponse(result, 'Category products retrieved successfully');
  });

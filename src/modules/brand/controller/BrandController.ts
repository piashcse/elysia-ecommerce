import { Elysia, t } from 'elysia';
import { BrandService } from '../service/BrandService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { idParams } from '../../../core/schemas';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const service = new BrandService();
const body = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 5000 })),
  logoUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
  isActive: t.Optional(t.Boolean()),
});

export const brandController = new Elysia({ prefix: '/brands', tags: ['Brand'] })
  .use(authPlugin)
  .get('/', {
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      search: t.Optional(t.String({ maxLength: 100 })),
      isActive: t.Optional(t.Boolean()),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'List brands' }
  }, async ({ query, user }) => {
    const { page, limit } = getPagination(query);
    const { items, total } = await service.list(page, limit, {
      search: query.search,
      isActive: user?.role === UserRole.ADMIN ? query.isActive : true,
    });
    return paginatedResponse(items, { page, limit, total, totalPages: Math.ceil(total / limit) }, 'Brands retrieved successfully');
  })
  .get('/slug/:slug', {
    params: t.Object({ slug: t.String({ maxLength: 120 }) }),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Get a brand by slug' }
  }, async ({ params }) => successResponse(await service.getBySlug(params.slug), 'Brand retrieved successfully'))
  .get('/:id', {
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Get a brand by ID' }
  }, async ({ params }) => successResponse(await service.get(params.id), 'Brand retrieved successfully'))
  .post('/', {
    hasRole: UserRole.ADMIN,
    body,
    response: { 201: successSchema(), 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Create a brand (Admin only)' }
  }, async ({ body, set }) => {
    const record = await service.createBrand(body);
    set.status = 201;
    return successResponse(record, 'Brand created successfully', 201);
  })
  .put('/:id', {
    hasRole: UserRole.ADMIN,
    params: idParams,
    body: t.Partial(body),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Update a brand (Admin only)' }
  }, async ({ params, body }) => successResponse(await service.updateBrand(params.id, body), 'Brand updated successfully'))
  .delete('/:id', {
    hasRole: UserRole.ADMIN,
    params: idParams,
    response: { 200: successSchema(t.Null()), 404: errorSchema },
    detail: { summary: 'Delete a brand (Admin only)' }
  }, async ({ params }) => {
    await service.deleteBrand(params.id);
    return successResponse(null, 'Brand deleted successfully');
  });

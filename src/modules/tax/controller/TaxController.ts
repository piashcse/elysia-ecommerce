import { Elysia, t } from 'elysia';
import { TaxService } from '../service/TaxService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { idParams } from '../../../core/schemas';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const taxService = new TaxService();

const taxBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  country: t.String({ minLength: 1, maxLength: 100 }),
  region: t.Optional(t.String({ maxLength: 100 })),
  rate: t.Number({ minimum: 0, maximum: 1 }),
  isActive: t.Optional(t.Boolean()),
});

export const taxController = new Elysia({ prefix: '/tax-rates', tags: ['Tax'] })
  .use(authPlugin)
  .get('/', {
    hasRole: UserRole.ADMIN,
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'List tax rates (Admin only)' }
  }, async ({ query }) => {
    const { page, limit } = getPagination(query);
    const { items, total } = await taxService.list(page, limit);
    return paginatedResponse(items, { page, limit, total, totalPages: Math.ceil(total / limit) }, 'Tax rates retrieved successfully');
  })
  .post('/', {
    hasRole: UserRole.ADMIN,
    body: taxBody,
    response: { 201: successSchema(), 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Create a tax rate (Admin only)' }
  }, async ({ body, set }) => {
    const record = await taxService.create(body);
    set.status = 201;
    return successResponse(record, 'Tax rate created successfully', 201);
  })
  .put('/:id', {
    hasRole: UserRole.ADMIN,
    params: idParams,
    body: t.Partial(taxBody),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Update a tax rate (Admin only)' }
  }, async ({ params, body }) => {
    const record = await taxService.update(params.id, body as any);
    return successResponse(record, 'Tax rate updated successfully');
  })
  .delete('/:id', {
    hasRole: UserRole.ADMIN,
    params: idParams,
    response: { 200: successSchema(t.Null()), 404: errorSchema },
    detail: { summary: 'Delete a tax rate (Admin only)' }
  }, async ({ params }) => {
    await taxService.delete(params.id);
    return successResponse(null, 'Tax rate deleted successfully');
  });

import { Elysia, t } from 'elysia';
import { ReturnsService } from '../service/ReturnsService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { idParams, uuid } from '../../../core/schemas';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const returnsService = new ReturnsService();

export const returnsController = new Elysia({ prefix: '/returns', tags: ['Returns'] })
  .use(authPlugin)
  .guard({ isAuth: true })
  .post('/', {
    body: t.Object({
      orderId: uuid,
      reason: t.String({ minLength: 1, maxLength: 1000 }),
      notes: t.Optional(t.String({ maxLength: 2000 })),
      items: t.Array(t.Object({
        orderItemId: uuid,
        quantity: t.Integer({ minimum: 1, maximum: 100 }),
      }), { minItems: 1, maxItems: 50 }),
    }),
    response: { 201: successSchema(), 400: errorSchema, 403: errorSchema, 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Request a return' }
  }, async ({ body, user, set }) => {
    const record = await returnsService.create(user as any, body.orderId, body);
    set.status = 201;
    return successResponse(record, 'Return requested successfully', 201);
  })
  .get('/', {
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      orderId: t.Optional(uuid),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'List returns (Admin: all, Customer: own)' }
  }, async ({ query, user }) => {
    const { page, limit } = getPagination(query);
    const { items, total } = await returnsService.list(user as any, page, limit, query.orderId);
    return paginatedResponse(items, { page, limit, total, totalPages: Math.ceil(total / limit) }, 'Returns retrieved successfully');
  })
  .get('/:id', {
    params: idParams,
    response: { 200: successSchema(), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Get a return by ID' }
  }, async ({ params, user }) => {
    return successResponse(await returnsService.get(user as any, params.id), 'Return retrieved successfully');
  })
  .post('/:id/approve', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema(), 409: errorSchema },
    detail: { summary: 'Approve a return (Admin only)' }
  }, async ({ params }) => successResponse(await returnsService.updateStatus(params.id, 'approved'), 'Return approved'))
  .post('/:id/reject', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema(), 409: errorSchema },
    detail: { summary: 'Reject a return (Admin only)' }
  }, async ({ params }) => successResponse(await returnsService.updateStatus(params.id, 'rejected'), 'Return rejected'))
  .post('/:id/receive', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema(), 409: errorSchema },
    detail: { summary: 'Mark a return as received and restore stock (Admin only)' }
  }, async ({ params }) => successResponse(await returnsService.updateStatus(params.id, 'received'), 'Return received'))
  .post('/:id/refund', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema(), 409: errorSchema },
    detail: { summary: 'Refund a received return (Admin only)' }
  }, async ({ params }) => successResponse(await returnsService.refund(params.id), 'Return refunded'));

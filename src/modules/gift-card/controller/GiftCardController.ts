import { Elysia, t } from 'elysia';
import { GiftCardService } from '../service/GiftCardService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { idParams } from '../../../core/schemas';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const service = new GiftCardService();

export const giftCardController = new Elysia({ prefix: '/gift-cards', tags: ['Gift Card'] })
  .use(authPlugin)
  .get('/', {
    hasRole: UserRole.ADMIN,
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'List gift cards (Admin only)' }
  }, async ({ query }) => {
    const { page, limit } = getPagination(query);
    const { items, total } = await service.list(page, limit);
    return paginatedResponse(items, { page, limit, total, totalPages: Math.ceil(total / limit) }, 'Gift cards retrieved successfully');
  })
  .post('/', {
    hasRole: UserRole.ADMIN,
    body: t.Object({
      code: t.Optional(t.String({ minLength: 4, maxLength: 50 })),
      balance: t.Number({ minimum: 0.01, maximum: 100000 }),
      currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
      expiresAt: t.Optional(t.String({ format: 'date-time' })),
    }),
    response: { 201: successSchema(), 409: errorSchema, 422: errorSchema },
    detail: { summary: 'Create a gift card (Admin only)' }
  }, async ({ body, set }) => {
    const record = await service.create(body);
    set.status = 201;
    return successResponse(record, 'Gift card created successfully', 201);
  })
  .get('/:code', {
    isAuth: true,
    params: t.Object({ code: t.String({ minLength: 4, maxLength: 50 }) }),
    response: { 200: successSchema(), 404: errorSchema, 409: errorSchema },
    detail: { summary: 'Check a gift card balance' }
  }, async ({ params }) => {
    const record = await service.getByCode(params.code);
    return successResponse({ code: record.code, balance: record.balance, currency: record.currency, expiresAt: record.expiresAt }, 'Gift card retrieved successfully');
  })
  .delete('/:id', {
    hasRole: UserRole.ADMIN,
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Deactivate a gift card (Admin only)' }
  }, async ({ params }) => successResponse(await service.deactivate(params.id), 'Gift card deactivated successfully'));

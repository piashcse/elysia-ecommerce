import { Elysia, t } from 'elysia';
import { CurrencyService } from '../service/CurrencyService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const service = new CurrencyService();

export const currencyController = new Elysia({ prefix: '/currencies', tags: ['Currency'] })
  .use(authPlugin)
  .get('/', {
    response: { 200: successSchema() },
    detail: { summary: 'List active currencies' }
  }, async () => successResponse(await service.list(), 'Currencies retrieved successfully'))
  .get('/convert', {
    query: t.Object({
      amount: t.Number({ minimum: 0 }),
      from: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
      to: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
    }),
    response: { 200: successSchema(), 422: errorSchema },
    detail: { summary: 'Convert an amount between currencies' }
  }, async ({ query }) => successResponse(
    await service.convert(query.amount, query.from ?? 'USD', query.to ?? 'USD'),
    'Currency converted successfully'
  ))
  .post('/', {
    hasRole: UserRole.ADMIN,
    body: t.Object({
      code: t.String({ minLength: 3, maxLength: 3 }),
      name: t.String({ minLength: 1, maxLength: 100 }),
      symbol: t.String({ minLength: 1, maxLength: 10 }),
      rate: t.Number({ minimum: 0.000001, maximum: 100000 }),
      isActive: t.Optional(t.Boolean()),
    }),
    response: { 201: successSchema(), 422: errorSchema },
    detail: { summary: 'Create or replace a currency (Admin only)' }
  }, async ({ body, set }) => {
    const record = await service.upsert(body);
    set.status = 201;
    return successResponse(record, 'Currency saved successfully', 201);
  })
  .patch('/:code', {
    hasRole: UserRole.ADMIN,
    params: t.Object({ code: t.String({ minLength: 3, maxLength: 3 }) }),
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      symbol: t.Optional(t.String({ minLength: 1, maxLength: 10 })),
      rate: t.Optional(t.Number({ minimum: 0.000001, maximum: 100000 })),
      isActive: t.Optional(t.Boolean()),
    }),
    response: { 200: successSchema(), 404: errorSchema, 422: errorSchema },
    detail: { summary: 'Update a currency (Admin only)' }
  }, async ({ params, body }) => successResponse(await service.update(params.code, body), 'Currency updated successfully'))
  .delete('/:code', {
    hasRole: UserRole.ADMIN,
    params: t.Object({ code: t.String({ minLength: 3, maxLength: 3 }) }),
    response: { 200: successSchema(), 404: errorSchema, 409: errorSchema },
    detail: { summary: 'Deactivate a currency (Admin only)' }
  }, async ({ params }) => successResponse(await service.remove(params.code), 'Currency deactivated successfully'));

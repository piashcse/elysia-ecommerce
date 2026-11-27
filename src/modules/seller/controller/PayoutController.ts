import { Elysia, t } from 'elysia';
import { PayoutService } from '../../seller/service/PayoutService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { idParams } from '../../../core/schemas';

const service = new PayoutService();

export const payoutController = new Elysia({ prefix: '/payouts', tags: ['Seller'] })
  .use(authPlugin)
  .get('/', {
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema() },
    detail: { summary: 'List seller payouts (Admin only)' }
  }, async () => successResponse(await service.list(), 'Payouts retrieved successfully'))
  .post('/', {
    hasRole: UserRole.ADMIN,
    body: t.Object({
      sellerId: t.String({ format: 'uuid' }),
      amount: t.Number({ minimum: 0.01, maximum: 999999.99 }),
      reference: t.Optional(t.String({ maxLength: 100 })),
      notes: t.Optional(t.String({ maxLength: 1000 })),
      periodStart: t.Optional(t.String({ format: 'date-time' })),
      periodEnd: t.Optional(t.String({ format: 'date-time' })),
    }),
    response: { 201: successSchema(), 422: errorSchema },
    detail: { summary: 'Create a seller payout (Admin only)' }
  }, async ({ body, set }) => {
    const record = await service.create(body);
    set.status = 201;
    return successResponse(record, 'Payout created successfully', 201);
  })
  .patch('/:id', {
    hasRole: UserRole.ADMIN,
    params: idParams,
    body: t.Object({ status: t.Union([t.Literal('pending'), t.Literal('paid'), t.Literal('cancelled')]) }),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Update payout status (Admin only)' }
  }, async ({ params, body }) => successResponse(await service.updateStatus(params.id, body.status), 'Payout updated successfully'));

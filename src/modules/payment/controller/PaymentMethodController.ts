import { Elysia, t } from 'elysia';
import { SavedPaymentMethodService } from '../service/SavedPaymentMethodService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams } from '../../../core/schemas';

const service = new SavedPaymentMethodService();

export const paymentMethodController = new Elysia({ prefix: '/payment-methods', tags: ['Payment'] })
  .use(authPlugin)
  .guard({ isAuth: true })
  .get('/', {
    response: { 200: successSchema() },
    detail: { summary: 'List saved payment methods' }
  }, async ({ user }) => successResponse(await service.list(user!.sub), 'Payment methods retrieved successfully'))
  .post('/', {
    body: t.Object({
      provider: t.String({ minLength: 1, maxLength: 50 }),
      token: t.String({ minLength: 1, maxLength: 255 }),
      brand: t.Optional(t.String({ maxLength: 50 })),
      last4: t.Optional(t.String({ pattern: '^[0-9]{4}$' })),
      expMonth: t.Optional(t.Integer({ minimum: 1, maximum: 12 })),
      expYear: t.Optional(t.Integer({ minimum: 2000, maximum: 2100 })),
      isDefault: t.Optional(t.Boolean()),
    }),
    response: { 201: successSchema(), 422: errorSchema },
    detail: { summary: 'Save a tokenized payment method' }
  }, async ({ body, user, set }) => {
    const record = await service.create(user!.sub, body);
    set.status = 201;
    return successResponse(record, 'Payment method saved successfully', 201);
  })
  .delete('/:id', {
    params: idParams,
    response: { 200: successSchema(t.Null()), 404: errorSchema },
    detail: { summary: 'Delete a saved payment method' }
  }, async ({ params, user }) => {
    await service.remove(user!.sub, params.id);
    return successResponse(null, 'Payment method deleted successfully');
  });

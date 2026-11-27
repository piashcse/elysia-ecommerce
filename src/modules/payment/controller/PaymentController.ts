import { Elysia, t } from 'elysia';
import { PaymentService } from '../service/PaymentService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams, uuid } from '../../../core/schemas';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const paymentService = new PaymentService();

const paymentDetailsSchema = t.Object({
  cardNumber: t.Optional(t.String({ pattern: '^[0-9]{13,19}$' })),
  cardExpiry: t.Optional(t.String({ pattern: '^(0[1-9]|1[0-2])\/[0-9]{2}$' })),
  cardCvv: t.Optional(t.String({ pattern: '^[0-9]{3,4}$' })),
  cardHolderName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  paypalEmail: t.Optional(t.String({ format: 'email', maxLength: 255 })),
});

const paymentMethodSchema = t.Union([
  t.Literal('credit_card'),
  t.Literal('debit_card'),
  t.Literal('paypal'),
  t.Literal('bank_transfer'),
  t.Literal('cash_on_delivery')
]);

const paymentStatusSchema = t.Union([
  t.Literal('pending'),
  t.Literal('completed'),
  t.Literal('failed'),
  t.Literal('refunded'),
]);

export const paymentController = new Elysia({ prefix: '/payments', tags: ['Payment'] })
  .use(authPlugin)
  .post('/', {
    body: t.Object({
      orderId: uuid,
      method: paymentMethodSchema,
      amount: t.Number({ minimum: 0.01, maximum: 999999.99 }),
      metadata: t.Optional(t.Record(t.String(), t.Any())),
      guestToken: t.Optional(t.String({ maxLength: 128 })),
    }),
    response: {
      201: successSchema(),
      400: errorSchema,
      403: errorSchema,
      409: errorSchema,
      422: errorSchema
    },
    detail: { summary: 'Create initial payment record' }
  }, async ({ body, set, user }) => {
    const payment = await paymentService.createPayment(user, body as any, body.guestToken);
    set.status = 201;
    return successResponse(payment, 'Payment created successfully', 201);
  })

  .post('/process', {
    body: t.Object({
      orderId: uuid,
      method: paymentMethodSchema,
      amount: t.Number({ minimum: 0.01, maximum: 999999.99 }),
      paymentDetails: paymentDetailsSchema,
      paymentMethodId: t.Optional(uuid),
      guestToken: t.Optional(t.String({ maxLength: 128 })),
    }),
    response: {
      200: successSchema(),
      400: errorSchema,
      402: errorSchema,
      403: errorSchema,
      409: errorSchema,
      422: errorSchema
    },
    detail: { summary: 'Process payment with gateway simulation' }
  }, async ({ body, user }) => {
    const payment = await paymentService.processPayment(user, body as any, body.guestToken);
    return successResponse(payment, 'Payment processed successfully');
  })

  .get('/', {
    isAuth: true,
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      status: t.Optional(paymentStatusSchema),
      method: t.Optional(paymentMethodSchema),
      dateFrom: t.Optional(t.String({ format: 'date-time' })),
      dateTo: t.Optional(t.String({ format: 'date-time' })),
      orderId: t.Optional(uuid),
      userId: t.Optional(uuid),
    }),
    response: {
      200: paginatedSchema()
    },
    detail: { summary: 'Get payments (Admin: all, Customer: own)' }
  }, async ({ query, user }) => {
    const isAdmin = user?.role === UserRole.ADMIN;
    const { page, limit } = getPagination(query);
  
    const filters = {
      status: query.status,
      method: query.method,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      orderId: query.orderId,
      userId: isAdmin ? query.userId : (user!.sub as string),
    };
  
    const { items, total } = await paymentService.getPayments(page, limit, filters);
  
    return paginatedResponse(
      items,
      { page, limit, total, totalPages: Math.ceil(total / limit) },
      'Payments retrieved successfully'
    );
  })

  .get('/:id', {
    params: idParams,
    query: t.Object({ guestToken: t.Optional(t.String({ maxLength: 128 })) }),
    response: {
      200: successSchema(),
      403: errorSchema,
      404: errorSchema
    },
    detail: { summary: 'Get payment details by ID' }
  }, async ({ params, user, query }) => {
    const payment = await paymentService.getPaymentById(user, params.id, query.guestToken);
    return successResponse(payment, 'Payment retrieved successfully');
  })

  .post('/:id/refund', {
    params: idParams,
    body: t.Optional(t.Object({
      amount: t.Optional(t.Number({ minimum: 0.01, maximum: 999999.99 })),
    })),
    hasRole: UserRole.ADMIN,
    response: {
      200: successSchema(),
      400: errorSchema,
      404: errorSchema,
      409: errorSchema
    },
    detail: { summary: 'Refund a completed payment (Admin only)' }
  }, async ({ params, body }) => {
    const payment = await paymentService.refundPayment(params.id, body?.amount);
    return successResponse(payment, 'Payment refunded successfully');
  })

  .post('/:id/complete', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: {
      200: successSchema(),
      404: errorSchema,
      409: errorSchema
    },
    detail: { summary: 'Mark an offline payment as completed (Admin only)' }
  }, async ({ params }) => {
    const payment = await paymentService.completeOfflinePayment(params.id);
    return successResponse(payment, 'Payment marked as completed');
  });

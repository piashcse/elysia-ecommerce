import { Elysia, t } from 'elysia';
import { PaymentService } from '../service/PaymentService';
import { errorResponse, paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';

const paymentService = new PaymentService();

// Payment details validation schemas
const cardDetailsSchema = t.Object({
  cardNumber: t.Optional(t.String({ pattern: '^[0-9]{13,19}$' })),
  cardExpiry: t.Optional(t.String({ pattern: '^(0[1-9]|1[0-2])\/[0-9]{2}$' })),
  cardCvv: t.Optional(t.String({ pattern: '^[0-9]{3,4}$' })),
  cardHolderName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
});

const paypalDetailsSchema = t.Object({
  paypalEmail: t.Optional(t.String({ format: 'email', maxLength: 255 })),
});

const paymentMethodSchema = t.Union([
  t.Literal('credit_card'),
  t.Literal('debit_card'),
  t.Literal('paypal'),
  t.Literal('bank_transfer'),
  t.Literal('cash_on_delivery')
]);

export const paymentController = new Elysia({ prefix: '/payments', tags: ['Payment'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  // Create a new payment
  .post(
    '/',
    async ({ body, set }) => {
      const payment = await paymentService.createPayment(body as any);
      set.status = 201;
      return successResponse(payment, 'Payment created successfully', 201);
    },
    {
      body: t.Object({
        orderId: t.String(),
        method: paymentMethodSchema,
        amount: t.Number({ minimum: 0.01, maximum: 999999.99 }),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Create initial payment record' }
    }
  )

  // Process a payment
  .post(
    '/process',
    async ({ body }) => {
      const payment = await paymentService.processPayment(body as any);
      return successResponse(payment, 'Payment processed successfully');
    },
    {
      body: t.Object({
        orderId: t.String(),
        method: paymentMethodSchema,
        amount: t.Number({ minimum: 0.01, maximum: 999999.99 }),
        paymentDetails: t.Union([cardDetailsSchema, paypalDetailsSchema]),
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Process payment with gateway simulation' }
    }
  )

  // Get payments
  .get(
    '/',
    async ({ query, user }) => {
      const isAdmin = user?.role === UserRole.ADMIN;
      const page = query.page || PAGINATION.DEFAULT_PAGE;
      const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

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
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        'Payments retrieved successfully'
      );
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        status: t.Optional(t.String()),
        method: t.Optional(paymentMethodSchema),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
        orderId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
      response: {
        200: paginatedSchema()
      },
      detail: { summary: 'Get payments (Admin: all, Customer: own)' }
    }
  )

  // Get payment by ID
  .get(
    '/:id',
    async ({ params, user }) => {
      const payment = await paymentService.getPaymentById(params.id);
      if (!payment) throw new Error('Payment not found');

      if (user?.role !== UserRole.ADMIN && payment.order.userId !== user?.sub) {
        throw new Error('Access denied');
      }

      return successResponse(payment, 'Payment retrieved successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(),
        403: errorSchema,
        404: errorSchema
      },
      detail: { summary: 'Get payment details by ID' }
    }
  )

  // Refund (admin only)
  .post(
    '/:id/refund',
    async ({ params }) => {
      const payment = await paymentService.refundPayment(params.id);
      return successResponse(payment, 'Payment refunded successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Refund a completed payment (Admin only)' }
    }
  );

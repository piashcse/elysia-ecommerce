import { Elysia, t } from 'elysia';
import { PaymentService } from '../service/PaymentService';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const paymentService = new PaymentService();

export const paymentController = new Elysia({ prefix: '/payments', tags: ['Payment'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  // Create a new payment
  .post(
    '/',
    async ({ body, set }) => {
      // Cast body to CreatePaymentDto because 'method' is string in schema but specific union in DTO
      // Or just let it flow if Service accepts string and validates it.
      // PaymentService expects CreatePaymentDto.
      // We should probably check if we can tighten the schema.
      const payment = await paymentService.createPayment(body as any);
      set.status = 201;
      return successResponse(payment, 'Payment created successfully', 201);
    },
    {
      body: t.Object({
        orderId: t.String(),
        method: t.Union([
          t.Literal('credit_card'),
          t.Literal('debit_card'),
          t.Literal('paypal'),
          t.Literal('bank_transfer'),
          t.Literal('cash_on_delivery')
        ]),
        amount: t.Number(),
        metadata: t.Optional(t.Record(t.String(), t.Any())) // t.Unknown is safer but Any maps to explicit any
      }),
      response: { 201: t.Any(), 400: t.Any(), 422: t.Any() },
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
        method: t.Union([
          t.Literal('credit_card'),
          t.Literal('debit_card'),
          t.Literal('paypal'),
          t.Literal('bank_transfer'),
          t.Literal('cash_on_delivery')
        ]),
        amount: t.Number(),
        paymentDetails: t.Object({
          cardNumber: t.Optional(t.String()),
          cardExpiry: t.Optional(t.String()),
          cardCvv: t.Optional(t.String()),
          cardHolderName: t.Optional(t.String()),
          paypalEmail: t.Optional(t.String())
        })
      }),
      response: { 200: t.Any(), 400: t.Any(), 422: t.Any() },
      detail: { summary: 'Process payment with gateway simulation' }
    }
  )

  // Get payments
  .get(
    '/',
    async ({ query, user }) => {
      const isAdmin = user?.role === UserRole.ADMIN;
      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 10;

      const filters = {
        status: query.status,
        method: query.method,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        orderId: query.orderId,
        userId: isAdmin ? query.userId : (user!.sub as string),
      };

      const { payments, total } = await paymentService.getPayments(page, limit, filters);

      return paginatedResponse(
        payments,
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
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(t.String()),
        method: t.Optional(t.String()),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
        orderId: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
      response: { 200: t.Any() },
      detail: { summary: 'Get payments (Admin: all, Customer: own)' }
    }
  )

  // Get payment by ID
  .get(
    '/:id',
    async ({ params, set, user }) => {
      const { id } = params;

      const payment = await paymentService.getPaymentById(id);
      if (!payment) {
        set.status = 404;
        return errorResponse('Payment not found', 'NOT_FOUND', 404);
      }

      // Check if user is admin or owner of order associated with payment
      // user.sub is string, payment.order.userId is string
      if (user?.role !== UserRole.ADMIN && payment.order.userId !== user?.sub) {
        set.status = 403;
        return errorResponse('Access denied. You can only view your own payments.', 'FORBIDDEN', 403);
      }

      return successResponse(payment, 'Payment retrieved successfully');
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: { 200: t.Any(), 403: t.Any(), 404: t.Any() },
      detail: { summary: 'Get payment details by ID' }
    }
  )

  // Refund (admin only)
  .post(
    '/:id/refund',
    async ({ params }) => {
      const { id } = params;
      const payment = await paymentService.refundPayment(id);
      return successResponse(payment, 'Payment refunded successfully');
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: { 200: t.Any(), 400: t.Any(), 404: t.Any() },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Refund a completed payment (Admin only)' }
    }
  );

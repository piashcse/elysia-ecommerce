import { Elysia, t } from 'elysia';
import { PaymentService } from '../service/PaymentService';
import { createPaymentSchema, paymentIdSchema, processPaymentSchema } from '../validators/PaymentValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

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
      const validatedData = validate(createPaymentSchema, body);
      const payment = await paymentService.createPayment(validatedData);
      set.status = 201;
      return successResponse(payment, 'Payment created successfully', 201);
    },
    {
      body: t.Object({
        orderId: t.String(),
        method: t.String(),
        amount: t.Number(),
        metadata: t.Optional(t.Record(t.String(), t.Unknown()))
      }),
      response: { 201: t.Any(), 400: t.Any(), 422: t.Any() },
      detail: { summary: 'Create initial payment record' }
    }
  )

  // Process a payment
  .post(
    '/process',
    async ({ body }) => {
      const validatedData = validate(processPaymentSchema, body);
      const payment = await paymentService.processPayment(validatedData);
      return successResponse(payment, 'Payment processed successfully');
    },
    {
      body: t.Object({
        orderId: t.String(),
        method: t.String(),
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
      const isAdmin = user!.role === 'admin';
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;

      const filters = {
        status: query.status as string,
        method: query.method as string,
        dateFrom: query.dateFrom as string,
        dateTo: query.dateTo as string,
        orderId: query.orderId as string,
        userId: isAdmin ? (query.userId as string) : (user!.sub as string),
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
      validate(paymentIdSchema, { id });

      const payment = await paymentService.getPaymentById(id);
      if (!payment) {
        set.status = 404;
        return errorResponse('Payment not found', 'NOT_FOUND', 404);
      }

      // Check if user is admin or owner of order associated with payment
      if (user!.role !== 'admin' && payment.order.userId !== user!.sub) {
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
      validate(paymentIdSchema, { id });
      const payment = await paymentService.refundPayment(id);
      return successResponse(payment, 'Payment refunded successfully');
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: { 200: t.Any(), 400: t.Any(), 404: t.Any() },
      hasRole: 'admin',
      detail: { summary: 'Refund a completed payment (Admin only)' }
    }
  );
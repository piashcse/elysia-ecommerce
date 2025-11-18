import { Elysia, t } from 'elysia';
import { PaymentService } from '../service/PaymentService';
import { 
  createPaymentSchema,
  processPaymentSchema,
  updatePaymentSchema,
  paymentIdSchema,
  paymentFilterSchema
} from '../validators/PaymentValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { NotFoundError, UnauthorizedError, ConflictError } from '../../../core/errors';
import { isAuthenticated, hasRole } from '../../../utils/jwt';

const paymentService = new PaymentService();

export const paymentController = new Elysia({ prefix: '/payments' })
  // Create a new payment
  .post(
    '/',
    async ({ body, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const validatedData = validate(createPaymentSchema, body);
        const payment = await paymentService.createPayment(validatedData);
        
        set.status = 201;
        return successResponse(payment, 'Payment created successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        orderId: t.String(),
        method: t.String(),
        amount: t.Number(),
        metadata: t.Optional(t.Record(t.String(), t.Unknown()))
      })
    }
  )
  
  // Process a payment
  .post(
    '/process',
    async ({ body, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const validatedData = validate(processPaymentSchema, body);
        const payment = await paymentService.processPayment(validatedData);
        
        return successResponse(payment, 'Payment processed successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
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
      })
    }
  )
  
  // Get all payments (admin only) or user's payments
  .get(
    '/',
    async ({ query, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        // Check if user has admin role to view all payments
        const isAdmin = jwt.role === 'admin';
        
        // Parse and validate query parameters
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        
        const filters = {
          status: query.status as string,
          method: query.method as string,
          dateFrom: query.dateFrom as string,
          dateTo: query.dateTo as string,
          orderId: query.orderId as string,
          userId: isAdmin ? (query.userId as string) : jwt.sub,
        };
        
        // If not admin, only allow viewing user's own payments
        if (!isAdmin) {
          filters.userId = jwt.sub;
        }
        
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
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
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
      })
    }
  )
  
  // Get payment by ID
  .get(
    '/:id',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        const { id } = params;
        validate(paymentIdSchema, { id });
        
        const payment = await paymentService.getPaymentById(id);
        
        if (!payment) {
          set.status = 404;
          return errorResponse('Payment not found');
        }
        
        // Check if user is admin or owner of payment
        if (jwt.role !== 'admin' && payment.order.user.id !== jwt.sub) {
          set.status = 403;
          return errorResponse('Access denied. You can only view your own payments.');
        }
        
        return successResponse(payment, 'Payment retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )
  
  // Update payment (admin only)
  .put(
    '/:id',
    async ({ params, body, set, jwt }) => {
      try {
        // Check if user is authenticated and has admin role
        if (!jwt || jwt.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }
        
        const { id } = params;
        validate(paymentIdSchema, { id });
        const validatedData = validate(updatePaymentSchema, body);
        
        const payment = await paymentService.updatePayment(id, validatedData);
        
        return successResponse(payment, 'Payment updated successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        status: t.String(),
        transactionId: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown()))
      })
    }
  )
  
  // Refund a payment
  .post(
    '/:id/refund',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated and has admin role
        if (!jwt || jwt.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }
        
        const { id } = params;
        validate(paymentIdSchema, { id });
        
        const payment = await paymentService.refundPayment(id);
        
        return successResponse(payment, 'Payment refunded successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )
  
  // Get user's payment statistics
  .get(
    '/stats',
    async ({ set, jwt }) => {
      try {
        // Check if user is authenticated
        if (!jwt) {
          set.status = 401;
          return errorResponse('Authentication required');
        }
        
        // Check if user has admin role to view overall stats
        const isAdmin = jwt.role === 'admin';
        const userId = isAdmin ? undefined : jwt.sub;
        
        const stats = await paymentService.getPaymentStats(userId);
        
        return successResponse(stats, 'Payment statistics retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    }
  );
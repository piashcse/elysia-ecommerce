import { Elysia, NotFound as ElysiaNotFound, ParseError as ElysiaParseError, ValidationError as ElysiaValidationError } from 'elysia';
import { openapi } from '@elysia/openapi';
import { cors } from '@elysia/cors';
import { loggingMiddleware } from './middlewares/logging';
import { connectDB, closeDB } from './config/database';
import envConfig from './config/env';
import { helmetMiddleware } from './middlewares/helmet';
import { rateLimiterMiddleware } from './middlewares/rateLimiter';
import { requestIdMiddleware } from './middlewares/requestId';
import { jwtPlugin } from './core/jwt';
import { AppError } from './core/errors';
import { mapDatabaseError } from './core/db-errors';
import { errorResponse, sanitizeData } from './core/responses';
import { authController } from './modules/auth/controller/AuthController';
import { sellerController } from './modules/seller/controller/SellerController';
import { userController } from './modules/user/controller/UserController';
import { productController } from './modules/product/controller/ProductController';
import { categoryController } from './modules/category/controller/CategoryController';
import { cartController } from './modules/cart/controller/CartController';
import { wishlistController } from './modules/wishlist/controller/WishlistController';
import { orderController } from './modules/order/controller/OrderController';
import { paymentController } from './modules/payment/controller/PaymentController';
import { reviewController } from './modules/review/controller/ReviewController';
import { couponController } from './modules/coupon/controller/CouponController';
import { notificationController } from './modules/notification/controller/NotificationController';
import { shippingController } from './modules/shipping/controller/ShippingController';
import { addressController } from './modules/address/controller/AddressController';
import { checkoutController } from './modules/checkout/controller/CheckoutController';
import { taxController } from './modules/tax/controller/TaxController';
import { returnsController } from './modules/returns/controller/ReturnsController';
import { invoiceController } from './modules/order/controller/InvoiceController';

const app = new Elysia();

await connectDB();

const getRequestId = (set: any): string => {
  const existing = set.headers['X-Request-ID'];
  if (typeof existing === 'string' && existing.length > 0) return existing;
  const requestId = crypto.randomUUID();
  set.headers['X-Request-ID'] = requestId;
  return requestId;
};

// Middleware must be registered before controllers so its global hooks apply
// to every route (Helmet, rate limiting, request IDs).
app
  .use(
    cors({
      origin: envConfig.ALLOWED_ORIGINS,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  )
  .use(helmetMiddleware)
  .use(loggingMiddleware)
  .use(rateLimiterMiddleware)
  .use(requestIdMiddleware)
  .use(jwtPlugin)
  .onAfterHandle(({ responseValue }) => {
    if (
      responseValue &&
      typeof responseValue === 'object' &&
      !(responseValue instanceof ReadableStream) &&
      !(responseValue instanceof Response) &&
      !(responseValue instanceof Blob)
    ) {
      return sanitizeData(responseValue);
    }
  });

// Centralized error handler. Never return raw database errors, SQL, or request
// bodies to clients.
app.onError(({ error, set, request }) => {
  const requestId = getRequestId(set);
  const err = error as any;

  if (error instanceof ElysiaNotFound) {
    set.status = 404;
    return errorResponse('Route not found', 'NOT_FOUND', 404, { requestId });
  }

  if (error instanceof ElysiaParseError) {
    set.status = 400;
    return errorResponse('Invalid request body', 'PARSE_ERROR', 400, { requestId });
  }

  if (error instanceof ElysiaValidationError) {
    // 422 for request validation; 500 when a response fails its schema.
    const status = error.status ?? 422;
    set.status = status;

    const fields = status === 422
      ? (error.errors ?? []).map((item: any) => ({
          path: String(item.instancePath ?? item.path ?? '').replace(/^\//, ''),
          message: String(item.message ?? 'Invalid value'),
        }))
      : undefined;

    if (envConfig.NODE_ENV !== 'test') console.warn('Request validation failed', {
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      code: 'VALIDATION_ERROR',
      fields: fields?.map((field) => field.path),
    });

    return errorResponse(
      status === 422 ? 'Validation failed' : 'Response validation failed',
      status === 422 ? 'VALIDATION_ERROR' : 'RESPONSE_VALIDATION_ERROR',
      status,
      { requestId, ...(fields ? { fields } : {}) }
    );
  }

  if (error instanceof AppError) {
    set.status = error.statusCode;
    if (envConfig.NODE_ENV !== 'test') console.warn('Application error', {
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      code: error.errorCode ?? 'APPLICATION_ERROR',
      status: error.statusCode,
      message: error.message,
    });
    return errorResponse(error.message, error.errorCode ?? 'APPLICATION_ERROR', error.statusCode, { requestId });
  }

  const mapped = mapDatabaseError(error);
  if (mapped) {
    set.status = mapped.statusCode;
    if (envConfig.NODE_ENV !== 'test') console.warn('Database request rejected', {
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      code: mapped.errorCode,
      status: mapped.statusCode,
    });
    return errorResponse(mapped.message, mapped.errorCode ?? 'DATABASE_ERROR', mapped.statusCode, { requestId });
  }

  if (envConfig.NODE_ENV !== 'test') console.error('Unhandled application error', {
    requestId,
    method: request.method,
    path: new URL(request.url).pathname,
    name: err?.name,
    code: err?.code,
    message: err?.message,
    stack: err?.stack,
  });

  set.status = 500;
  return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', 500, { requestId });
});

app
  .use(authController)
  .use(userController)
  .use(sellerController)
  .use(productController)
  .use(categoryController)
  .use(cartController)
  .use(wishlistController)
  .use(orderController)
  .use(paymentController)
  .use(reviewController)
  .use(couponController)
  .use(notificationController)
  .use(shippingController)
  .use(addressController)
  .use(checkoutController)
  .use(taxController)
  .use(returnsController)
  .use(invoiceController);

// OpenAPI documentation. The bearer scheme is also attached per protected
// route by the auth macros.
app.use(
  openapi({
    path: '/swagger',
    provider: 'swagger-ui',
    documentation: {
      info: {
        title: 'Elysia E-commerce API',
        version: '1.0.0',
        description: 'High-performance eCommerce backend built with Elysia.js and Drizzle ORM.',
        contact: {
          name: 'Mehedi Hassan Piash',
          email: 'piash599@gmail.com',
          url: 'https://piashcse.github.io',
        },
      },
      servers: [
        {
          url: `http://localhost:${envConfig.PORT}`,
          description: 'Local Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })
);

// Health check endpoint with diagnostics
app.get('/health', async ({ set }) => {
  const healthStatus: any = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: envConfig.NODE_ENV,
    version: '1.0.0',
  };

  if (envConfig.NODE_ENV !== 'production') {
    healthStatus.memory = process.memoryUsage();
  }

  try {
    const { db } = await import('./config/database');
    await db.execute('SELECT 1');
    healthStatus.database = 'connected';
  } catch (error) {
    healthStatus.database = 'disconnected';
    healthStatus.databaseError = (error as Error).message;
    set.status = 503;
    healthStatus.status = 'DEGRADED';
  }

  return healthStatus;
});

if (import.meta.main) {
  const PORT = envConfig.PORT;

  app.listen(PORT, () => {
    console.log(`Elysia E-commerce server is running on port ${PORT}`);
    console.log(`Environment: ${envConfig.NODE_ENV}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/swagger`);
  });
}

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}; shutting down gracefully...`);
  try {
    await closeDB();
  } finally {
    process.exit(0);
  }
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

export default app;

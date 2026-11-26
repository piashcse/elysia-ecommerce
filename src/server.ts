import { Elysia } from 'elysia';
import { openapi } from '@elysiajs/openapi';
import { cors } from '@elysiajs/cors';
import { logger } from '@bogeychan/elysia-logger';
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
  .use(
    logger({
      level: envConfig.NODE_ENV === 'test' ? 'silent' : envConfig.LOG_LEVEL,
      redact: {
        paths: ['request.headers.authorization', 'req.headers.authorization'],
        censor: '[REDACTED]',
      },
      autoLogging: envConfig.NODE_ENV === 'test'
        ? false
        : {
            // Error contexts can contain request bodies (including passwords).
            // The central error handler logs a redacted, structured summary instead.
            ignore: (ctx: any) =>
              ctx.isError === true ||
              ctx.path === '/health' ||
              ctx.path.includes('__server_sent_events__'),
          },
      customProps: (ctx: any) => ({
        path: ctx.path,
        method: ctx.request.method,
        userAgent: ctx.request.headers.get('user-agent'),
      }),
    } as any)
  )
  .use(rateLimiterMiddleware)
  .use(requestIdMiddleware)
  .use(jwtPlugin)
  .onAfterHandle(({ response }) => {
    if (
      response &&
      typeof response === 'object' &&
      !(response instanceof ReadableStream) &&
      !(response instanceof Response) &&
      !(response instanceof Blob)
    ) {
      return sanitizeData(response);
    }
  });

// Centralized error handler. Never return raw database errors, SQL, or request
// bodies to clients.
app.onError(({ code, error, set, request }) => {
  const requestId = getRequestId(set);
  const err = error as any;

  if (code === 'NOT_FOUND') {
    set.status = 404;
    return errorResponse('Route not found', 'NOT_FOUND', 404, { requestId });
  }

  if (code === 'VALIDATION' || code === 'PARSE') {
    set.status = 422;

    // Elysia includes the submitted values in its validation message. Only
    // expose the field path and a safe message.
    let fields: Array<{ path: string; message: string }> = [];
    try {
      const parsed = JSON.parse(err.message);
      if (Array.isArray(parsed.errors)) {
        fields = parsed.errors.map((item: any) => ({
          path: String(item.path ?? '').replace(/^\//, ''),
          message: String(item.message ?? 'Invalid value'),
        }));
      } else if (parsed.property) {
        fields = [{ path: String(parsed.property).replace(/^\//, ''), message: String(parsed.message ?? 'Invalid value') }];
      }
    } catch {
      // Not a JSON validation message; fall back to a generic message.
    }

    if (envConfig.NODE_ENV !== 'test') console.warn('Request validation failed', {
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      code,
      fields: fields.map((field) => field.path),
    });

    return errorResponse('Validation failed', 'VALIDATION_ERROR', 422, { requestId, fields });
  }

  if (error instanceof AppError) {
    set.status = error.statusCode;
    if (envConfig.NODE_ENV !== 'test') console.warn('Application error', {
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      code: error.errorCode ?? code,
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
  .use(addressController);

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

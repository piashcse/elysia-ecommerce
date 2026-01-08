import { Elysia } from 'elysia';
import { openapi } from '@elysiajs/openapi';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { logger } from '@bogeychan/elysia-logger';
import { connectDB } from './config/database';
import envConfig from './config/env';
import { helmetMiddleware } from './middlewares/helmet';
import { defaultRateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './core/errors';
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

// Initialize database connection
await connectDB();

// Register middlewares
app.use(cors())
    .use(helmetMiddleware)
    .use(logger({
        level: 'info',
        autoLogging: {
            ignore: (ctx) => {
                // Ignore health check and server-sent events endpoints from logging
                return ctx.path === '/health' || ctx.path.includes('__server_sent_events__');
            }
        },
        customProps: (ctx) => {
            return {
                path: ctx.path,
                method: ctx.request.method,
                userAgent: ctx.request.headers.get('user-agent'),
            };
        }
    }))
    .use(defaultRateLimiter)
    .use(
        jwt({
            name: 'jwt',
            secret: envConfig.JWT_SECRET,
        })
    )
    .onAfterHandle(({ response }) => {
        if (response && typeof response === 'object' && !(response instanceof ReadableStream) && !(response instanceof Response) && !(response instanceof Blob)) {
            return sanitizeData(response);
        }
    });

// Register controllers
app.use(authController)
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
    .onError(({ code, error, set }) => {
        const err = error as any;
        console.error('Application error occurred:', {
            code,
            message: err.message || 'Unknown error',
            stack: err.stack,
            timestamp: new Date().toISOString(),
        });

        if (code === 'VALIDATION' || code === 'PARSE') {
            set.status = 422;
            let message = err.message;
            let details = err;

            try {
                const parsed = JSON.parse(err.message);
                if (parsed.summary) message = parsed.summary;
                details = parsed;
            } catch (e) { }

            return errorResponse(message, code.toString(), 422, details);
        }

        if (error instanceof AppError) {
            const appErr = error as AppError;
            set.status = appErr.statusCode;
            return errorResponse(appErr.message, (appErr.errorCode || code).toString(), appErr.statusCode, appErr);
        }

        const statusCode = err.status || err.statusCode || 500;
        set.status = statusCode;
        return errorResponse(err.message || 'Internal server error', (err.code || code).toString(), statusCode, err);
    });

// Register Swagger/OpenAPI after routes to ensure discovery
app.use(
    openapi({
        path: '/swagger',
        provider: 'swagger-ui',
        documentation: {
            info: {
                title: "Elysia E-commerce API",
                version: "1.0.0",
                description: "High-performance eCommerce backend built with Elysia.js and Drizzle ORM.",
                contact: {
                    name: "Mehedi Hassan Piash",
                    email: "piash599@gmail.com",
                    url: "https://piashcse.github.io"
                }
            },
            servers: [
                {
                    url: `http://localhost:${envConfig.PORT}`,
                    description: "Local Development Server"
                }
            ]
        }
    })
);

// Health check endpoint
app.get('/health', () => ({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: envConfig.NODE_ENV
}));

// Start the server if this file is run directly
if (import.meta.main) {
    const PORT = envConfig.PORT;

    app.listen(PORT, () => {
        console.log(`Elysia E-commerce server is running on port ${PORT}`);
        console.log(`Environment: ${envConfig.NODE_ENV}`);
        console.log(`Swagger UI available at http://localhost:${PORT}/swagger`);
    });
}

export default app;

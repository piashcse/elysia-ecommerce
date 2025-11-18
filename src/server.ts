import 'reflect-metadata';
import {Elysia} from 'elysia';
import {swagger} from '@elysiajs/swagger';
import {cors} from '@elysiajs/cors';
import {jwt} from '@elysiajs/jwt';
import {connectDB} from './config/database';
import envConfig from './config/env';
import {helmetMiddleware} from './middlewares/helmet';
import {defaultRateLimiter} from './middlewares/rateLimiter';
import {loggingMiddleware} from './middlewares/logging';
import {errorHandler} from './middlewares/errorHandler';
import {userController} from './modules/user/controller/UserController';
import {productController} from './modules/product/controller/ProductController';
import {categoryController} from './modules/category/controller/CategoryController';
import {cartController} from './modules/cart/controller/CartController';
import {wishlistController} from './modules/wishlist/controller/WishlistController';
import {orderController} from './modules/order/controller/OrderController';
import {paymentController} from './modules/payment/controller/PaymentController';

const app = new Elysia();

// Initialize database connection
await connectDB();

// Register middlewares
app.use(
    swagger({
        provider: 'swagger-ui', // Use classic Swagger UI instead of Scalar
        documentation: {
            info: {
                title: "Elysia E-commerce API",
                version: "1.0.0",
                description: "High-performance eCommerce backend built with Elysia.js and TypeORM."
            },
            contact: {
                name: "Mehedi Hassan Piash",
                email: "piash599@gmail.com",
                url: "https://piashcse.github.io"
            },
            servers: [
                {
                    url: "http://localhost:3000",
                    description: "Local Development Server"
                },
                {
                    url: "https://api.domainname.com",
                    description: "Production Server"
                }
            ],
            tags: [
                { name: 'User' },
                { name: 'Product' },
                { name: 'Category' },
                { name: 'Cart' },
                { name: 'Wishlist' },
                { name: 'Order' },
                { name: 'Payment' }
            ]
        }
    })
)
    .use(cors())
    .use(helmetMiddleware)
    .use(loggingMiddleware)
    .use(defaultRateLimiter)
    .use(
        jwt({
            name: 'jwt',
            secret: envConfig.JWT_SECRET,
        })
    )
    .use(errorHandler);

// Register controllers
app.use(userController)
    .use(productController)
    .use(categoryController)
    .use(cartController)
    .use(wishlistController)
    .use(orderController)
    .use(paymentController);

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
        console.log(`Swagger UI available at http://localhost:${PORT}//swagger`);
    });
}

export default app;

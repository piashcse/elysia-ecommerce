# Elysia E-commerce API

A modern, high-performance eCommerce backend built with Elysia.js, Bun, and Drizzle ORM. This project is designed with a clean, modular architecture and production-ready best practices, providing a complete solution for e-commerce platforms.

## 🚀 Core Features

-   **RESTful API**: A comprehensive set of endpoints for all e-commerce functionalities.
-   **Authentication & Authorization**: Secure user registration and login using JWT and role-based access control (Admin, Seller, Customer).
-   **User Management**: Complete user profile management, including password changes and admin operations.
-   **Product & Category Management**: Full CRUD operations for products and categories, with support for stock management and seller associations.
-   **Shopping Cart & Wishlist**: Persistent shopping cart and wishlist functionality for an enhanced user experience.
-   **Order Management**: A complete order processing system with status tracking, order history, and stock management.
-   **Payment Processing**: Simulated payment processing with support for multiple payment methods and refund management.
-   **Seller Operations**: Dedicated endpoints for sellers to manage their products and view orders.
-   **Product Reviews & Ratings**: A complete system for customers to leave reviews and ratings on products.
-   **Discounts & Coupons**: Flexible coupon system with support for percentage or fixed discounts, usage limits, and expiration dates.
-   **Address Management**: Support for multiple shipping and billing addresses per user.
-   **Shipping Methods**: Configurable shipping options with cost calculation and delivery estimates.
-   **Advanced Product Options**: Support for multiple product images and product variants (e.g., size, color).
-   **Notification System**: A notification system for order updates, promotions, and other events.
-   **API Documentation**: Interactive API documentation powered by Swagger UI.
-   **Robust Security**: Middleware for rate limiting, CORS, and security headers (Helmet).
-   **Comprehensive Logging**: Detailed logging for monitoring and debugging.
-   **Type-Safe & Validated**: Ensures data integrity with Zod schema validation and Drizzle ORM's type-safe queries.

## 🛠 Tech Stack

-   **Runtime**: [Bun](https://bun.sh/)
-   **Framework**: [Elysia.js](https://elysiajs.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Authentication**: JWT (JSON Web Tokens)
-   **API Documentation**: Swagger UI
-   **Validation**: [Zod](https://zod.dev/)
-   **Security**: Helmet, CORS, Rate Limiting
-   **Password Hashing**: bcryptjs

## 🗂️ Project Structure

The project follows a modular architecture to ensure a clean separation of concerns, making it easy to scale and maintain.

```
src/
├── config/          # Environment, database, and other configurations
├── core/            # Core utilities like error handling and response formatting
├── database/        # Drizzle ORM schema and migration files
│   └── schema/
├── middlewares/     # Custom Elysia.js middlewares
├── modules/         # Feature modules (e.g., auth, user, product)
│   └── [module]/
│       ├── controller/  # API endpoints and routing
│       ├── service/     # Business logic
│       ├── dto/         # Data Transfer Objects
│       └── validators/  # Zod validation schemas
├── utils/           # Shared utility functions
├── server.ts        # Server setup and middleware registration
└── index.ts         # Application entry point
```

## 🌐 API Endpoints

The API is organized by modules. For a complete and interactive list of all endpoints, please visit the **Swagger UI** at `http://localhost:3000/swagger`.

### Key Modules & Prefixes:
-   **Auth**: `/auth`
-   **Users**: `/users`
-   **Products**: `/products`
-   **Categories**: `/categories`
-   **Cart**: `/cart`
-   **Wishlist**: `/wishlist`
-   **Orders**: `/orders`
-   **Payments**: `/payments`
-   **Reviews**: `/reviews`
-   **Coupons**: `/coupons`
-   **Addresses**: `/addresses`
-   **Shipping**: `/shipping-methods`
-   **Notifications**: `/notifications`

## 🚀 Getting Started

### Prerequisites
-   [Bun](https://bun.sh/) v1.0+
-   [PostgreSQL](https://www.postgresql.org/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/piashcse/elysia-ecom.git
    cd elysia-ecom
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory. You can copy the `.env.example` file if it exists.
    ```env
    PORT=3000
    NODE_ENV=development
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=elysia_ecom
    JWT_SECRET=your_jwt_secret
    ```

4.  **Set up the database:**
    Ensure your PostgreSQL server is running and create the database specified in your `.env` file.

5.  **Run database migrations:**
    ```bash
    bun run db:push
    ```

6.  **Start the development server:**
    ```bash
    bun run dev
    ```

The server will start on the port defined in your `.env` file (default: 3000), and you can access the Swagger UI at `http://localhost:3000/swagger`.

## 🛠️ Development Scripts

-   `bun run dev`: Start the development server with hot-reloading.
-   `bun run build`: Build the application for production.
-   `bun run start`: Start the production server.
-   `bun run db:generate`: Generate a new database migration.
-   `bun run db:push`: Apply migrations to the database.
-   `bun run db:studio`: Open Drizzle Studio to manage your database.

## 🔑 Authentication

The API uses JWT for authentication. To access protected endpoints, include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

You can obtain a token by registering and logging in via the `/auth/register` and `/auth/login` endpoints.

## 📊 Response Format

The API uses a standardized JSON response format for all requests.

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful.",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found.",
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource could not be found."
  }
}
```

### Paginated Response
For endpoints that return a list of items, the response will be paginated.
```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## 🎯 User Roles

-   **customer**: Default role for all registered users. Can manage their profile, orders, and cart.
-   **seller**: Can create and manage their own products and view orders for their products.
-   **admin**: Has full access to the system, including user management, all products, and system settings.

## 🗄️ Database Schema

The database schema is defined using Drizzle ORM in the `src/database/schema/` directory. The main tables include:

-   `users`
-   `products`, `categories`, `product_images`, `product_variants`
-   `carts`, `cart_items`
-   `wishlists`
-   `orders`, `order_items`
-   `payments`
-   `reviews`
-   `coupons`, `coupon_usage`
-   `addresses`
-   `shipping_methods`
-   `notifications`

## 🏗️ Architecture & Best Practices

This project adheres to modern software architecture principles to ensure it is scalable, maintainable, and robust.

-   **Modular Design**: Each feature is encapsulated in its own module, promoting separation of concerns.
-   **Service Layer**: Business logic is abstracted into services, keeping controllers lean.
-   **Type Safety**: Leverages TypeScript and Zod for end-to-end type safety.
-   **Dependency Injection**: Elysia's dependency injection is used to manage services and dependencies.
-   **Environment Configuration**: Centralized environment variable management for different environments (development, production).
-   **Security**: Implements security best practices, including password hashing, JWT, rate limiting, and protection against common vulnerabilities.
-   **Error Handling**: A centralized error handling middleware ensures consistent error responses.

## 🚢 Deployment Readiness

This application is built to be production-ready. Before deploying to a live environment, ensure you have:

-   Implemented a robust testing strategy (unit, integration, E2E tests).
-   Set up monitoring and error tracking (e.g., Sentry, Prometheus).
-   Configured a caching layer (e.g., Redis) for performance-critical endpoints.
-   Set up a CI/CD pipeline for automated deployments.
-   Configured a production-grade PostgreSQL database with automated backups.
-   Implemented a CDN for serving static assets and product images.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/your-feature`).
3.  Commit your changes (`git commit -m 'Add your feature'`).
4.  Push to the branch (`git push origin feature/your-feature`).
5.  Open a pull request.

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
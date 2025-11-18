# Elysia E-commerce

A modern, fast e-commerce platform built with Elysia.js, a Bun-first TypeScript framework.

## Project Overview

This is a basic skeleton for an e-commerce application built with Elysia.js. The project aims to provide a performant, scalable, and maintainable e-commerce solution.

## Features

- RESTful API endpoints
- Product management
- User authentication
- Shopping cart functionality
- Order processing
- Payment integration
- Inventory management

## Tech Stack

- **Framework**: [Elysia.js](https://elysiajs.com/) - Bun-first TypeScript framework
- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Database**: TBD (to be updated based on requirements)
- **ORM**: TBD (to be updated based on requirements)
- **Authentication**: TBD
- **Payment Processing**: TBD

## Project Structure

```
elysia-ecom/
├── src/                    # Source code
│   ├── config/            # Configuration files (database, environment, etc.)
│   ├── core/              # Core utilities and base classes
│   ├── database/          # Database related files (migrations, seeds)
│   │   └── migrations/    # Database migration files
│   ├── middlewares/       # Custom middleware functions
│   ├── modules/           # Feature modules (user, product, order, etc.)
│   │   ├── cart/          # Shopping cart module
│   │   ├── category/      # Product categories module
│   │   ├── order/         # Order management module
│   │   ├── payment/       # Payment processing module
│   │   ├── product/       # Product management module
│   │   ├── user/          # User management module
│   │   └── wishlist/      # Wishlist functionality module
│   │       ├── controller/ # API controllers
│   │       ├── dto/       # Data Transfer Objects for input validation
│   │       ├── entity/    # Database entities/models
│   │       ├── service/   # Business logic services
│   │       └── validators/ # Custom validation logic
│   ├── utils/             # Utility functions and helpers
│   ├── index.ts           # Main application entry point
│   └── server.ts          # Server configuration and setup
├── logs/                  # Application logs
├── .env                   # Environment variables (not committed)
├── .gitignore             # Git ignore rules
├── bun.lock               # Bun package lock file
├── package.json           # Project dependencies and scripts
├── README.md              # Project documentation
└── tsconfig.json          # TypeScript configuration
```

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables (see `.env.example`)

3. Run the development server:
   ```bash
   bun run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=3000
```

## API Endpoints

The application provides a comprehensive REST API with the following main endpoints:

### User Management
- `POST /users/register` - Register a new user
- `POST /users/login` - User login
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `DELETE /users/me` - Delete user account

### Product Management
- `GET /products` - Get all products
- `GET /products/:id` - Get a specific product
- `POST /products` - Create a new product (admin only)
- `PUT /products/:id` - Update a product (admin only)
- `DELETE /products/:id` - Delete a product (admin only)

### Category Management
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get a specific category
- `POST /categories` - Create a new category (admin only)
- `PUT /categories/:id` - Update a category (admin only)
- `DELETE /categories/:id` - Delete a category (admin only)

### Cart Management
- `GET /cart` - Get current user's cart
- `POST /cart` - Add item to cart
- `PUT /cart/:id` - Update cart item quantity
- `DELETE /cart/:id` - Remove item from cart

### Wishlist Management
- `GET /wishlist` - Get current user's wishlist
- `POST /wishlist` - Add item to wishlist
- `DELETE /wishlist/:id` - Remove item from wishlist

### Order Management
- `GET /orders` - Get current user's orders
- `GET /orders/:id` - Get a specific order
- `POST /orders` - Create a new order

### Payment Processing
- `POST /payments` - Process payment for an order

All API endpoints (except public ones like product listings) require authentication via JWT tokens. Detailed API documentation is available through Swagger UI when the application is running.

## Features

- **User Management**: Complete user registration, authentication, and profile management
- **Product Catalog**: Comprehensive product management with categorization
- **Shopping Cart**: Full-featured cart with add, update, and remove operations
- **Wishlist**: Product wishlist functionality for users
- **Order Processing**: Complete order management system
- **Payment Integration**: Support for multiple payment methods
- **Inventory Management**: Real-time stock tracking and management
- **API Documentation**: Auto-generated API documentation via Swagger UI
- **Security**: JWT-based authentication and authorization
- **Rate Limiting**: Built-in API rate limiting to prevent abuse

## Technology Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Framework**: [Elysia.js](https://elysiajs.com/) - Bun-first TypeScript framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Advanced open-source database
- **ORM**: [TypeORM](https://typeorm.io/) - TypeScript ORM for database operations
- **Authentication**: JWT (JSON Web Tokens) for secure authentication
- **API Documentation**: Swagger UI for interactive API documentation
- **Logging**: Winston for comprehensive application logging
- **Validation**: Zod for schema validation

## API Documentation

The API is documented using Swagger UI, accessible at:
```
http://localhost:3000/swagger
```

## Development

This project follows a modular architecture with clear separation of concerns:

- **Modular Design**: Each feature is organized in its own module with dedicated controllers, services, DTOs, and entities
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Testing Ready**: Structured to support comprehensive unit and integration tests
- **Scalability**: Designed with scalability in mind for both code and infrastructure

## Contributing

We welcome contributions from the community! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines

- Follow TypeScript and Elysia.js best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style and conventions
- Keep commits atomic and well-described

### Running Tests

To run the test suite:

```bash
bun run test
```

### Code Quality

This project follows TypeScript and Elysia.js best practices:

- Use TypeScript for all server-side code
- Follow functional programming patterns where appropriate
- Write comprehensive unit tests for all business logic
- Maintain clean, readable, and well-documented code
- Use proper error handling and logging

## Database Setup

Make sure PostgreSQL is installed and running on your system. Create a `.env` file in the root directory with the following variables:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_database_name
JWT_SECRET=change_this_to_a_strong_secret
```

The application will automatically create database tables when it starts up in development mode. In production, it will run pending migrations. The database connection automatically pulls configuration from your .env file:

- Tables are automatically synchronized in development (when `NODE_ENV=development`)
- Migrations are run in production or non-development environments

To start the application:
```bash
# Start the application (tables will be auto-created in development)
bun run dev
```

For manual migration management:
```bash
# Run migrations (for production environments)
bun run typeorm:run-migrations
```

## License

MIT

# Elysia E-commerce

A modern, high-performance eCommerce backend built with Elysia.js (Bun) and TypeORM.
Designed with clean architecture, modular structure, and production-ready best practices.
Includes authentication, product management, carts, orders, payments, wishlists, and more.

## 🚀 Features

- **RESTful API endpoints** for complete e-commerce functionality
- **Product management** with categories and inventory tracking
- **User authentication** with JWT tokens and role-based access (admin/customer)
- **Shopping cart** functionality with persistent storage
- **Wishlist** functionality for saving favorite products
- **Order processing** system with order management
- **Payment processing** module (implementation in progress)
- **Inventory management** with stock tracking
- **Comprehensive logging** with Winston logger
- **Rate limiting** to prevent API abuse
- **Security headers** with Helmet middleware
- **API documentation** with Swagger UI
- **Type-safe validation** with Zod schemas
- **Database migrations** support for production deployments

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Framework**: [Elysia.js](https://elysiajs.com/) - Bun-first TypeScript framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Advanced open-source database
- **ORM**: [TypeORM](https://typeorm.io/) - TypeScript ORM for database operations
- **Authentication**: JWT (JSON Web Tokens) with role-based access control
- **API Documentation**: Swagger UI for interactive API documentation
- **Logging**: [Winston](https://github.com/winstonjs/winston) for comprehensive application logging
- **Validation**: [Zod](https://zod.dev/) for schema validation and [class-validator](https://github.com/typestack/class-validator) for entity validation
- **Security**: Helmet middleware with various security headers
- **Rate Limiting**: [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible) for API protection
- **Password Hashing**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js/) for secure password storage

## 📦 Project Structure

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
## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Bun](https://bun.sh/) v1.0 or higher (installation guide below)
- [Node.js](https://nodejs.org/) v18 or higher (optional, but recommended for compatibility)
- [PostgreSQL](https://www.postgresql.org/) database server
- Git (for cloning the repository)

### Installing Bun

Choose your preferred installation method:

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Using npm:**
```bash
npm install -g bun
```

**Using Homebrew (macOS):**
```bash
brew tap oven-sh/bun
brew install bun
```

Verify your installation:
```bash
bun --version
```

### Setting up PostgreSQL

You'll need a PostgreSQL database to run this application. You can:

1. **Install PostgreSQL locally:**
   - **macOS:** `brew install postgresql`
   - **Ubuntu/Debian:** `sudo apt install postgresql postgresql-contrib`
   - **Windows:** Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

2. **Or use a cloud database service:**
   - [Railway](https://railway.app/)
   - [Supabase](https://supabase.com/)
   - [AWS RDS](https://aws.amazon.com/rds/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/piashcse/elysia-ecom.git
cd elysia-ecom
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server configuration
PORT=3000
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=elysia_ecommerce_dev

# JWT configuration (required)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Logging configuration
LOG_LEVEL=info
```

> **Note:** The `JWT_SECRET` variable is required and must be set.

### 4. Start PostgreSQL Service

Make sure your PostgreSQL service is running:

- **macOS (with Homebrew):** `brew services start postgresql`
- **Ubuntu/Debian:** `sudo systemctl start postgresql`
- **Windows:** Start PostgreSQL service through Services panel

### 5. Create Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL (using default postgres user)
psql -U postgres

# Create database
CREATE DATABASE elysia_ecommerce_dev;

# Create user (optional, for security)
CREATE USER ecommerce_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE elysia_ecommerce_dev TO ecommerce_user;

# Exit psql
\q
```

Alternatively, if you're using your own database user, make sure the database exists.

### 6. Run the Application

Start the development server:

```bash
bun run dev
```

The application will be available at: http://localhost:3000

> **Note:** In development mode (NODE_ENV=development), the application automatically synchronizes database tables based on your entities. In production mode, it runs pending migrations instead.

### 7. API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:3000/swagger
- OpenAPI JSON: http://localhost:3000/swagger/json

## 🛠 Development Scripts

The project includes several useful scripts:

- `bun run dev` - Start development server with auto-reload
- `bun run start` - Start production server
- `bun run build` - Build the application for production
- `bun run test` - Run tests
- `bun run typeorm:run-migrations` - Run database migrations manually
- `bun run typeorm:generate-migration` - Generate a new migration


## 🌐 API Endpoints

The application provides a comprehensive REST API with the following main endpoints:

### User Management
- `POST /users/register` - Register a new user
- `POST /users/login` - User login (returns JWT token)
- `GET /users/me` - Get current user profile (requires authentication)
- `PUT /users/me` - Update user profile (requires authentication)
- `DELETE /users/me` - Delete user account (requires authentication)
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID (admin only or self)
- `PUT /users/:id` - Update user by ID (admin only)
- `DELETE /users/:id` - Delete user by ID (admin only)

> **Note**: The system includes role-based access control with ADMIN and CUSTOMER roles. Admin users have additional permissions to manage other users and system resources.

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

All API endpoints (except public ones like product listings) require authentication via JWT tokens.

### Health Check
- `GET /health` - Check server health status (no authentication required)


## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Issues:**
- Ensure PostgreSQL is running: `brew services start postgresql` (macOS)
- Verify your `.env` file has correct database credentials
- Check that the database exists: `psql -U postgres -c "\l"` to list databases

**2. Bun Installation Issues:**
- Make sure you're using a compatible system (macOS, Linux, or Windows WSL)
- Try installing via npm if direct installation fails: `npm install -g bun`

**3. Missing Environment Variables:**
- Ensure you have a `.env` file with required variables
- The `JWT_SECRET` variable is mandatory and will cause the app to crash if not set

**4. Port Already in Use:**
- Change the `PORT` variable in your `.env` file
- Kill processes using the port: `lsof -ti:3000 | xargs kill -9` (macOS/Linux)

**5. Migration Issues:**
- Run migrations manually if auto-sync fails: `bun run typeorm:run-migrations`

### Development Tips

- Use `bun run dev` for development with auto-reload
- Check the logs in the `logs/` directory for detailed error information
- The application will automatically synchronize database tables in development mode (when NODE_ENV=development)
- In production, database migrations are automatically run on startup
- You can manually run migrations with: `bun run typeorm:run-migrations`
- Use the `.env.example` file as a reference for required environment variables


## 🤝 Contributing

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

### Code Quality

This project follows TypeScript and Elysia.js best practices:

- Use TypeScript for all server-side code
- Follow functional programming patterns where appropriate
- Write comprehensive unit tests for all business logic
- Maintain clean, readable, and well-documented code
- Use proper error handling and logging

## 👨‍💻 Developed By

<a href="https://twitter.com/piashcse" target="_blank">
  <img src="https://avatars.githubusercontent.com/piashcse" width="90" align="left">
</a>

**Mehedi Hassan Piash**

[![Twitter](https://img.shields.io/badge/-Twitter-1DA1F2?logo=x&logoColor=white&style=for-the-badge)](https://twitter.com/piashcse)
[![Medium](https://img.shields.io/badge/-Medium-00AB6C?logo=medium&logoColor=white&style=for-the-badge)](https://medium.com/@piashcse)
[![Linkedin](https://img.shields.io/badge/-LinkedIn-0077B5?logo=linkedin&logoColor=white&style=for-the-badge)](https://www.linkedin.com/in/piashcse/)
[![Web](https://img.shields.io/badge/-Web-0073E6?logo=appveyor&logoColor=white&style=for-the-badge)](https://piashcse.github.io/)
[![Blog](https://img.shields.io/badge/-Blog-0077B5?logo=readme&logoColor=white&style=for-the-badge)](https://piashcse.blogspot.com)

## 📄 License

```
Copyright 2024 piashcse (Mehedi Hassan Piash)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

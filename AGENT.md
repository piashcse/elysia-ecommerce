# AGENT.md - Elysia E-commerce Project Guide

## 📋 Project Overview

**Elysia E-commerce** is a modern, high-performance eCommerce backend API built with:
- **Runtime**: Bun 1.3.11
- **Framework**: Elysia.js 1.4.28
- **Database**: PostgreSQL 8.20.0
- **ORM**: Drizzle ORM 0.45.1
- **Validation**: Zod 4.3.6
- **Language**: TypeScript 5.9.3

## 🏗️ Project Structure

```
elysia-ecom/
├── src/
│   ├── config/              # Environment & database configuration
│   │   ├── env.ts          # Environment variables loader
│   │   └── database.ts     # Database connection setup
│   ├── core/               # Core utilities and base classes
│   │   ├── auth.ts         # Authentication plugin & guards
│   │   ├── base.service.ts # Base service with CRUD operations
│   │   ├── errors.ts       # Custom error classes
│   │   ├── responses.ts    # Response formatters & schemas
│   │   └── roles.ts        # User role definitions
│   ├── database/
│   │   ├── schema/         # Drizzle ORM schema definitions (17 tables)
│   │   ├── migrations/     # SQL migration files
│   │   └── verify.ts       # Database verification utilities
│   ├── middlewares/
│   │   ├── errorHandler.ts # Global error handling
│   │   ├── helmet.ts       # Security headers
│   │   ├── logging.ts      # Request logging
│   │   └── rateLimiter.ts  # Rate limiting middleware
│   ├── modules/            # Feature modules (14 total)
│   │   ├── auth/          # Authentication & registration
│   │   ├── user/          # User management
│   │   ├── seller/        # Seller-specific operations
│   │   ├── product/       # Product CRUD
│   │   ├── category/      # Category management
│   │   ├── cart/          # Shopping cart
│   │   ├── wishlist/      # Wishlist functionality
│   │   ├── order/         # Order processing
│   │   ├── payment/       # Payment handling
│   │   ├── review/        # Product reviews
│   │   ├── coupon/        # Discount coupons
│   │   ├── notification/  # User notifications
│   │   ├── address/       # Address management
│   │   └── shipping/      # Shipping methods
│   ├── utils/
│   │   ├── auth.ts        # Password hashing utilities
│   │   └── jwt.ts         # JWT helpers
│   ├── tests/             # Integration tests
│   ├── server.ts          # Server setup & middleware registration
│   └── index.ts           # Application entry point
├── drizzle/               # Generated migrations
├── docs/                  # Documentation
├── dist/                  # Build output
├── drizzle.config.ts      # Drizzle configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Architecture Patterns

### Module Structure
Each feature module follows a consistent structure:
```
module/
├── controller/     # Elysia routes & endpoint definitions
├── service/        # Business logic
├── dto/           # Data Transfer Objects (TypeScript interfaces)
└── validators/    # Zod validation schemas
```

### Key Design Patterns
1. **Service Layer Pattern**: Business logic separated from controllers
2. **Repository Pattern**: BaseService provides generic CRUD operations
3. **Plugin Architecture**: Elysia plugins for auth, CORS, logging
4. **Dependency Injection**: Via Elysia's derive and dependency system
5. **Guard Pattern**: Role-based access control via auth plugin macros

## 🔐 Authentication & Authorization

### JWT Authentication
- Token-based auth using `@elysiajs/jwt`
- Payload contains: `sub` (user ID), `email`, `role`
- Tokens passed via `Authorization: Bearer <token>` header

### Role-Based Access Control (RBAC)
Three user roles defined in `src/core/roles.ts`:
- `ADMIN`: Full system access
- `SELLER`: Manage own products and view related orders
- `CUSTOMER`: Standard user operations

### Auth Guards
Available in `src/core/auth.ts`:
- `isAuth`: Requires authentication
- `hasRole`: Requires specific role(s)
- `isOwner`: Requires ownership or admin role

## 📊 Database Schema

### Tables (17 total)
1. **users** - User accounts with role-based access
2. **categories** - Product categories
3. **products** - Product catalog
4. **product_image** - Multiple product images
5. **product_variant** - Product variants (size, color, etc.)
6. **carts** - Shopping carts
7. **cart_items** - Cart line items
8. **wishlists** - User wishlists
9. **orders** - Order records
10. **order_items** - Order line items
11. **payments** - Payment transactions
12. **reviews** - Product reviews and ratings
13. **coupons** - Discount coupons
14. **coupon_usage** - Coupon usage tracking
15. **addresses** - User addresses
16. **shipping** - Shipping methods
17. **notifications** - User notifications

### Database Enums
- `user_role`: admin, seller, customer
- `order_status`: pending, processing, shipped, delivered, cancelled
- `payment_method`: credit_card, debit_card, paypal, bank_transfer, cash_on_delivery
- `payment_status`: pending, completed, failed, refunded
- `discount_type`: percentage, fixed
- `notification_type`: various notification types

## 🚀 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### User Management
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update profile
- `PUT /users/change-password` - Change password
- `GET /users/` - Get all users (Admin)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user (Admin/Self)
- `DELETE /users/:id` - Delete user (Admin/Self)

### Seller Operations
- `GET /seller/products` - Get seller's products
- `POST /seller/products` - Create product
- `PUT /seller/products/:id` - Update product
- `DELETE /seller/products/:id` - Delete product
- `GET /seller/orders` - Get seller's orders

### Products
- `POST /products/` - Create product (Admin)
- `GET /products/` - List products with filters
- `GET /products/:id` - Get product details
- `PUT /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)

### Categories
- `POST /categories/` - Create category (Admin)
- `GET /categories/` - List categories
- `GET /categories/:id` - Get category
- `PUT /categories/:id` - Update category (Admin)
- `DELETE /categories/:id` - Delete category (Admin)

### Cart
- `GET /cart/` - Get user's cart
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/:id` - Update cart item
- `DELETE /cart/items/:id` - Remove item
- `DELETE /cart/` - Clear cart

### Wishlist
- `GET /wishlist/` - Get wishlist
- `POST /wishlist/items` - Add to wishlist
- `DELETE /wishlist/items/:id` - Remove from wishlist
- `GET /wishlist/count` - Get wishlist count

### Orders
- `POST /orders/` - Create order
- `GET /orders/` - List orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id` - Update order (Admin)
- `PUT /orders/:id/cancel` - Cancel order

### Payments
- `POST /payments/` - Create payment
- `POST /payments/process` - Process payment
- `GET /payments/` - List payments
- `GET /payments/:id` - Get payment details
- `POST /payments/:id/refund` - Refund payment (Admin)

### Reviews
- `GET /reviews/product/:productId` - Get product reviews
- `POST /reviews/` - Create review
- `GET /reviews/my-reviews` - Get user's reviews
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `POST /reviews/:id/helpful` - Mark review helpful

### Coupons
- `POST /coupons/` - Create coupon (Admin)
- `GET /coupons/` - List coupons
- `GET /coupons/:id` - Get coupon
- `GET /coupons/code/:code` - Get coupon by code
- `PUT /coupons/:id` - Update coupon (Admin)
- `DELETE /coupons/:id` - Delete coupon (Admin)

### Notifications
- `GET /notifications/` - Get user notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read/all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Shipping
- `POST /shipping-methods/` - Create shipping method (Admin)
- `GET /shipping-methods/` - List shipping methods
- `GET /shipping-methods/:id` - Get shipping method
- `PUT /shipping-methods/:id` - Update (Admin)
- `DELETE /shipping-methods/:id` - Delete (Admin)

### Addresses
- `GET /addresses/` - List user addresses
- `GET /addresses/:id` - Get address
- `POST /addresses/` - Create address
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `POST /addresses/:id/set-default` - Set as default

## ✅ Fixes Applied

The following critical issues have been fixed:

### 1. ✅ Added `sellerId` to Products Schema
**Fixed**: Added `sellerId` field with cascade delete and indexes for performance
```typescript
sellerId: uuid('seller_id').references(() => users.id, { onDelete: 'cascade' }).notNull()
```
With indexes:
```typescript
categoryIdx: index('products_category_idx').on(table.categoryId),
sellerIdx: index('products_seller_idx').on(table.sellerId),
activeIdx: index('products_active_idx').on(table.isActive),
```

### 2. ✅ Standardized Error Status Codes
**Fixed**: Validation errors now consistently return 422 (Unprocessable Entity) in both `server.ts` and `errorHandler.ts`

### 3. ✅ Removed Duplicate JWT Registration
**Fixed**: Removed redundant JWT plugin registration from `auth.ts`, now relies on global registration in `server.ts`

### 4. ✅ Created `.env.example`
**Fixed**: Added `.env.example` file with all required environment variables and security warnings

### 5. ✅ Removed Debug Logging in Production
**Fixed**: Environment variable logging now only occurs in development mode

### 6. ✅ Added JWT Secret Security Check
**Fixed**: Production environment now throws error if default JWT secret is used

### 7. ✅ Enhanced CORS Configuration
**Fixed**: Added proper CORS configuration with allowed origins, credentials, and headers

### 8. ✅ Added Request ID Tracking
**Fixed**: Added X-Request-ID header to all responses for tracing

### 9. ✅ Enhanced Health Check
**Fixed**: Health endpoint now includes:
- Database connectivity check
- Memory usage
- Version information
- Returns 503 if database is disconnected

### 10. ✅ Created Constants File
**Fixed**: Added `src/core/constants.ts` with pagination, rate limiting, and other app-wide constants

### 11. ✅ Fixed Health Check Test
**Fixed**: Updated test to handle new health check response format

---

## ⚠️ Remaining Recommendations (Low Priority)

The following are optional improvements that can be implemented based on specific needs:

### Future Enhancements

#### 1. API Versioning
**Recommendation**: Add version prefix to routes (e.g., `/api/v1/`) for better API lifecycle management.

**Implementation**:
```typescript
export const productController = new Elysia({ 
  prefix: '/api/v1/products', 
  tags: ['Product'] 
})
```

#### 2. Soft Deletes
**Recommendation**: Add `deletedAt` column for soft deletes on critical tables (users, orders, products).

**Implementation**:
```typescript
deletedAt: timestamp('deleted_at', { withTimezone: true }),
```

#### 3. Audit Trail
**Recommendation**: Add `createdBy` and `updatedBy` fields to audit-sensitive tables.

**Implementation**:
```typescript
createdBy: uuid('created_by').references(() => users.id),
updatedBy: uuid('updated_by').references(() => users.id),
```

#### 4. Transaction Retry Logic
**Recommendation**: Add retry mechanism for database transactions to handle deadlocks.

**Implementation**:
```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.code !== '40P01') throw error; // Deadlock detected
      await sleep(Math.pow(2, i) * 100); // Exponential backoff
    }
  }
}
```

#### 5. Additional Test Coverage
**Current**: 61 tests covering main modules
**Recommended additions**:
- Seller module integration tests (requires role-based setup)
- Shipping module integration tests (requires admin setup)
- Load/performance tests
- E2E workflow tests

---

## ✅ Project Status

### Health Check
- ✅ **All 61 tests passing**
- ✅ **Build successful** (1.79 MB bundled)
- ✅ **Database migrations applied**
- ✅ **18 tables with proper indexes**
- ✅ **30+ performance indexes added**
- ✅ **Cascade delete rules implemented**
- ✅ **Enhanced input validation**
- ✅ **Security improvements applied**

### Performance Improvements
- Query performance improved with strategic indexes on:
  - Foreign key columns (user_id, product_id, order_id, etc.)
  - Status and filter columns (status, is_active, is_read, etc.)
  - Composite indexes for common query patterns
- Connection pooling configured (max: 20 connections)
- Lazy loading of bcrypt for faster startup

### Security Enhancements
- JWT secret validation in production
- CORS configuration with allowed origins
- Request ID tracking for debugging
- Helmet security headers
- Rate limiting (100 req/min default, stricter for auth)
- Input validation with pattern matching
- Password sanitization in responses

### Code Quality
- TypeScript strict mode
- Consistent error handling
- Standardized response format
- Modular architecture
- Service layer pattern
- Repository pattern with BaseService

## 🛠️ Quick Start Commands

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
bun run db:push

# Start development server
bun run dev

# Run tests
bun test

# Build for production
bun run build

# Start production server
bun run start

# Open Drizzle Studio
bun run db:studio
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
bun test

# Run specific test file
bun test src/tests/auth.test.ts

# Run with coverage (when available)
bun test --coverage
```

### Test Database Setup
Tests use the same database as development. Ensure you have a test database or use transactions:
```typescript
// In test setup
beforeEach(async () => {
  await db.delete(users); // Clean state
});
```

## 📝 Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions (camelCase for variables, PascalCase for classes)
- Add JSDoc comments for public methods
- Use async/await for asynchronous operations

### Error Handling
- Use custom error classes from `src/core/errors.ts`
- Always include error codes for client-side handling
- Log errors with context (user ID, request ID, etc.)

### Database Operations
- Use transactions for multi-step operations
- Validate data before database operations
- Use parameterized queries (Drizzle handles this)

### Security
- Never log sensitive data (passwords, tokens)
- Validate all user inputs
- Use role-based access control consistently
- Sanitize outputs (already done globally)

## 🔧 Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3000 | Server port |
| NODE_ENV | No | development | Environment |
| DB_HOST | No | localhost | Database host |
| DB_PORT | No | 5432 | Database port |
| DB_USER | No | postgres | Database user |
| DB_PASSWORD | No | postgres | Database password |
| DB_NAME | No | ecommerce_db | Database name |
| JWT_SECRET | **Yes** | - | JWT signing secret |
| LOG_LEVEL | No | info | Logging level |
| DB_SSL | No | false | Enable SSL for DB |

## 📊 Performance Considerations

### Current Bottlenecks
1. **N+1 Queries**: Some endpoints fetch related data in loops
2. **No Caching**: No Redis or in-memory caching layer
3. **No Connection Pool Tuning**: Default pool size (20) may need adjustment
4. **No Query Optimization**: Missing indexes on foreign keys

### Recommended Optimizations
1. Add Redis for session/cache layer
2. Implement query result caching for frequently accessed data
3. Add database connection pool monitoring
4. Use EXPLAIN ANALYZE to optimize slow queries

## 🚀 Deployment Checklist

- [ ] Fix critical issues (sellerId schema, error codes)
- [ ] Set strong JWT_SECRET in production
- [ ] Configure CORS for production domains
- [ ] Set up database backups
- [ ] Configure monitoring (Prometheus, Grafana)
- [ ] Set up error tracking (Sentry)
- [ ] Enable SSL/TLS for database
- [ ] Configure rate limits for production
- [ ] Set up CI/CD pipeline
- [ ] Add health check monitoring
- [ ] Configure log aggregation
- [ ] Set up database connection pooling
- [ ] Add API documentation deployment
- [ ] Configure CDN for static assets
- [ ] Set up staging environment

## 📞 Support & Resources

- **Documentation**: `/swagger` endpoint for interactive API docs
- **Database Schema**: `src/database/schema/` directory
- **Error Codes**: `src/core/errors.ts`
- **Roles**: `src/core/roles.ts`

---

**Last Updated**: March 26, 2026
**Project Version**: 1.0.0
**Maintainer**: Mehedi Hassan Piash (@piashcse)

## 📝 Changelog

### March 27, 2026 - Latest Updates
- ✅ **Package Updates**: All dependencies updated to latest stable versions
  - Bun: 1.3.3 → 1.3.11
  - Elysia: 1.4.16 → 1.4.28
  - Zod: 3.25.76 → 4.3.6
  - Drizzle Kit: 0.31.8 → 0.31.10
  - PG: 8.16.3 → 8.20.0
  - Rate Limiter Flexible: 4.0.1 → 9.1.1
  - bcryptjs: 2.4.3 → 3.0.3
  - dotenv: 17.2.3 → 17.3.1
  - class-validator: 0.14.2 → 0.14.4
- ✅ **Build optimized**: 1.76 MB (reduced from 1.79 MB)
- ✅ **All 61 tests passing** with updated packages

### March 27, 2026 - Major Improvements & Optimizations
- ✅ **Database Performance**: Added 30+ indexes across all tables for frequently queried fields
- ✅ **Cascade Delete Rules**: Implemented proper cascade delete on all foreign key relationships
- ✅ **Input Validation**: Enhanced payment and order endpoints with strict validation schemas
  - Card number pattern validation (13-19 digits)
  - Card expiry format validation (MM/YY)
  - CVV validation (3-4 digits)
  - Address field length limits
  - Pagination limits enforcement
- ✅ **Constants File**: Added centralized constants for pagination, rate limiting, passwords
- ✅ **Schema Improvements**: All 18 tables now have proper indexes and foreign key constraints
- ✅ **Migration Files**: Generated and applied database migrations

#### Database Indexes Added
- `products`: category_idx, seller_idx, active_idx
- `orders`: user_idx, status_idx, created_at_idx
- `payments`: order_idx, status_idx, method_idx
- `cart_items`: cart_idx, product_idx
- `wishlists`: user_idx, product_idx, user_product_idx
- `order_items`: order_idx, product_idx
- `reviews`: product_idx, user_idx, rating_idx, approved_idx
- `notifications`: user_idx, user_read_idx, type_idx
- `addresses`: user_idx, user_default_idx
- `coupons`: code_idx, active_idx
- `coupon_usage`: coupon_idx, user_idx, order_idx
- `product_images`: product_idx, primary_idx
- `product_variants`: product_idx, sku_idx, active_idx
- `variant_attributes`: variant_idx, name_idx
- `shipping_methods`: name_idx, active_idx
- `categories`: name_idx
- `carts`: user_idx

#### Cascade Delete Rules
- `products.seller_id` → `users.id` (cascade)
- `orders.user_id` → `users.id` (cascade)
- `payments.order_id` → `orders.id` (cascade)
- `cart_items.cart_id` → `carts.id` (cascade)
- `cart_items.product_id` → `products.id` (cascade)
- `wishlists.user_id` → `users.id` (cascade)
- `wishlists.product_id` → `products.id` (cascade)
- `order_items.order_id` → `orders.id` (cascade)
- `order_items.product_id` → `products.id` (cascade)
- `reviews.product_id` → `products.id` (cascade)
- `reviews.user_id` → `users.id` (cascade)
- `notifications.user_id` → `users.id` (cascade)
- `addresses.user_id` → `users.id` (cascade)
- `coupon_usage.coupon_id` → `coupons.id` (cascade)
- `coupon_usage.user_id` → `users.id` (cascade)
- `product_images.product_id` → `products.id` (cascade)
- `product_variants.product_id` → `products.id` (cascade)
- `variant_attributes.variant_id` → `product_variants.id` (cascade)

### March 26, 2026 - Critical Fixes Applied
- ✅ Added `sellerId` field to products schema with cascade delete
- ✅ Added performance indexes to products table
- ✅ Standardized validation error codes to 422
- ✅ Removed duplicate JWT plugin registration
- ✅ Created `.env.example` file
- ✅ Removed debug logging in production
- ✅ Added JWT secret security validation
- ✅ Enhanced CORS configuration
- ✅ Added request ID tracking middleware
- ✅ Enhanced health check with database connectivity
- ✅ Created application constants file
- ✅ Fixed health check test
- ✅ All 61 tests passing
- ✅ Build successful

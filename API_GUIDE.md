# API Quick Start Guide

## 🚀 Server Status
✅ **Server Running**: http://localhost:3005
✅ **Swagger UI**: http://localhost:3005/swagger
✅ **Health Check**: http://localhost:3005/health

## 📋 Available API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### User Management
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update current user profile
- `POST /users/change-password` - Change password
- `GET /users/` - Get all users (Admin only)
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user (Admin only)
- `DELETE /users/{id}` - Delete user (Admin only)

### Products
- `GET /products/` - Get all products (with filters)
- `GET /products/{id}` - Get product by ID
- `POST /products/` - Create product (Admin only)
- `PUT /products/{id}` - Update product (Admin only)
- `DELETE /products/{id}` - Delete product (Admin only)

### Categories
- `GET /categories/` - Get all categories
- `GET /categories/{id}` - Get category by ID
- `POST /categories/` - Create category (Admin only)
- `PUT /categories/{id}` - Update category (Admin only)
- `DELETE /categories/{id}` - Delete category (Admin only)

### Cart
- `GET /cart/` - Get user's cart
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/{id}` - Update cart item quantity
- `DELETE /cart/items/{id}` - Remove item from cart
- `DELETE /cart/` - Clear entire cart

### Wishlist
- `GET /wishlist/` - Get user's wishlist
- `POST /wishlist/items` - Add item to wishlist
- `DELETE /wishlist/items/{id}` - Remove item from wishlist
- `GET /wishlist/count` - Get wishlist count

### Orders
- `POST /orders/` - Create new order
- `GET /orders/` - Get all orders (Admin: all, User: own)
- `GET /orders/{id}` - Get order by ID
- `PUT /orders/{id}` - Update order status (Admin only)
- `POST /orders/{id}/cancel` - Cancel order

### Payments
- `POST /payments/` - Create payment record
- `POST /payments/process` - Process payment
- `GET /payments/` - Get payments
- `GET /payments/{id}` - Get payment by ID
- `POST /payments/{id}/refund` - Refund payment (Admin only)

### Seller
- `GET /seller/products` - Get seller's products
- `POST /seller/products` - Create product as seller
- `PUT /seller/products/{id}` - Update seller's product
- `GET /seller/orders` - Get seller's orders

## 🔑 Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Example: Register and Login

```bash
# Register
curl -X POST http://localhost:3005/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3005/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🎯 Testing with Swagger

1. Open http://localhost:3005/swagger in your browser
2. Click "Authorize" button
3. Enter your JWT token (get it from login)
4. Test any endpoint directly from the UI

## 🛠️ Development Commands

```bash
# Start development server with hot reload
bun run dev

# Build for production
bun run build

# Run production server
bun run start

# Database commands
bun run db:generate  # Generate migrations
bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
```

## 📝 Notes

- Default port: 3005
- Database: PostgreSQL (elysia-ecom)
- All timestamps are in UTC
- Passwords are hashed with bcrypt
- JWT tokens expire based on configuration

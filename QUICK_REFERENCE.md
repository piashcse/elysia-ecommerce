# 🚀 Developer Quick Reference

## Server Commands

```bash
# Development (with hot reload)
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Database operations
bun run db:generate  # Generate migrations
bun run db:push      # Apply to database
bun run db:studio    # Open Drizzle Studio
```

## 🔗 Important URLs

- **API Base**: http://localhost:3005
- **Swagger UI**: http://localhost:3005/swagger
- **Health Check**: http://localhost:3005/health

## 📋 Quick API Reference

### Authentication
```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
# Returns: { token: "jwt-token" }
```

### Using Authentication
```bash
# Add to headers for protected endpoints
Authorization: Bearer <your-jwt-token>
```

### Products
```bash
GET    /products              # List all products
GET    /products/:id          # Get product details
POST   /products              # Create product (admin)
PUT    /products/:id          # Update product (admin)
DELETE /products/:id          # Delete product (admin)
```

### Reviews ⭐ NEW!
```bash
GET    /reviews/product/:id   # Get product reviews
POST   /reviews               # Create review
GET    /reviews/my-reviews    # Your reviews
PUT    /reviews/:id           # Update review
DELETE /reviews/:id           # Delete review
POST   /reviews/:id/helpful   # Mark helpful
```

### Cart
```bash
GET    /cart                  # Get your cart
POST   /cart/items            # Add item
PUT    /cart/items/:id        # Update quantity
DELETE /cart/items/:id        # Remove item
DELETE /cart                  # Clear cart
```

### Orders
```bash
POST   /orders                # Create order
GET    /orders                # List orders
GET    /orders/:id            # Get order details
PUT    /orders/:id            # Update status (admin)
POST   /orders/:id/cancel     # Cancel order
```

### Payments
```bash
POST   /payments              # Create payment
POST   /payments/process      # Process payment
GET    /payments              # List payments
GET    /payments/:id          # Get payment details
POST   /payments/:id/refund   # Refund (admin)
```

## 🗄️ Database Schema Quick Ref

### Core Tables
- `users` - User accounts
- `products` - Product catalog
- `categories` - Product categories
- `carts` - Shopping carts
- `cart_items` - Cart contents
- `wishlists` - User wishlists
- `orders` - Customer orders
- `order_items` - Order contents
- `payments` - Payment records

### New Tables ⭐
- `reviews` - Product reviews
- `coupons` - Discount coupons
- `coupon_usage` - Usage tracking
- `addresses` - User addresses
- `shipping_methods` - Shipping options
- `product_images` - Multiple images
- `product_variants` - Product variations
- `variant_attributes` - Variant details
- `notifications` - User notifications

## 🎯 User Roles

- `customer` - Regular user (default)
- `seller` - Can create/manage products
- `admin` - Full access

## 📊 Response Formats

### Success
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error"
  }
}
```

### Paginated
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

## 🔧 Common Tasks

### Create Admin User
```typescript
// In database or via API
{
  "email": "admin@example.com",
  "password": "secure-password",
  "role": "admin"
}
```

### Add Product with Category
```bash
# 1. Create category
POST /categories
{
  "name": "Electronics",
  "description": "Electronic items"
}

# 2. Create product
POST /products
{
  "name": "Laptop",
  "description": "Gaming laptop",
  "price": 1299.99,
  "stockQuantity": 10,
  "categoryId": "category-uuid",
  "sku": "LAP-001"
}
```

### Complete Order Flow
```bash
# 1. Add to cart
POST /cart/items
{
  "productId": "product-uuid",
  "quantity": 2
}

# 2. View cart
GET /cart

# 3. Create order
POST /orders
{
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ],
  "shippingAddress": { ... },
  "billingAddress": { ... }
}

# 4. Process payment
POST /payments/process
{
  "orderId": "order-uuid",
  "method": "credit_card",
  "amount": 100.00,
  "paymentDetails": { ... }
}
```

### Add Product Review
```bash
# After purchasing
POST /reviews
{
  "productId": "product-uuid",
  "rating": 5,
  "title": "Great product!",
  "comment": "Highly recommended"
}
```

## 🐛 Debugging

### Check Server Status
```bash
curl http://localhost:3005/health
```

### View Server Logs
```bash
# Server runs in terminal, check output
```

### Test Endpoint
```bash
curl -X GET http://localhost:3005/products
```

### Test with Auth
```bash
curl -X GET http://localhost:3005/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── core/            # Core utilities (errors, responses)
├── database/        # Database schema
│   └── schema/      # Drizzle schemas
├── middlewares/     # Custom middlewares
├── modules/         # Feature modules
│   ├── auth/
│   ├── user/
│   ├── product/
│   ├── category/
│   ├── cart/
│   ├── wishlist/
│   ├── order/
│   ├── payment/
│   ├── seller/
│   └── review/      # ⭐ NEW
├── utils/           # Utility functions
├── server.ts        # Server setup
└── index.ts         # Entry point
```

## 🎨 Module Structure

Each module follows this pattern:
```
module/
├── controller/      # API routes
├── service/         # Business logic
├── dto/             # Data transfer objects
└── validators/      # Zod schemas
```

## 💡 Tips

1. **Always use Swagger UI** for testing - it's interactive!
2. **Check health endpoint** if server seems down
3. **Review logs** for detailed error messages
4. **Use Drizzle Studio** to inspect database
5. **JWT tokens expire** - get a new one if auth fails
6. **Pagination** - Use `?page=1&limit=10` on list endpoints
7. **Filtering** - Check Swagger for available filters

## 🔐 Security Notes

- Never commit `.env` file
- Use strong JWT_SECRET in production
- Enable HTTPS in production
- Implement rate limiting per endpoint
- Sanitize user inputs
- Use prepared statements (Drizzle does this)
- Hash passwords (bcrypt implemented)
- Validate all inputs (Zod implemented)

## 📚 Documentation Files

- `API_GUIDE.md` - Detailed API guide
- `PROJECT_STATUS.md` - Complete project status
- `FEATURE_ANALYSIS.md` - Feature analysis
- `NEW_FEATURES_SUMMARY.md` - New features
- `REFACTORING_SUMMARY.md` - Refactoring details
- `QUICK_REFERENCE.md` - This file

---

**Need Help?** Check Swagger UI or review the detailed documentation files!

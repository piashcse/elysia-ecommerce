# Updated Architecture

## Auth Module
- **Purpose**: Handle all authentication-related functionality
- **Endpoints**:
  - `POST /auth/register` - User registration
  - `POST /auth/register/seller` - Seller registration (creates user + seller profile)
  - `POST /auth/login` - User login
  - `GET /auth/me` - Get current user profile
  - `PUT /auth/me` - Update current user profile
  - `PUT /auth/change-password` - Change password
  - `POST /auth/refresh` - Refresh token
  - `POST /auth/logout` - Logout

## User Module
- **Purpose**: Handle user management (admin operations and authenticated user operations)
- **Endpoints**:
  - `GET /users/profile` - Get current user profile (kept for compatibility)
  - `PUT /users/profile` - Update current user profile (kept for compatibility) 
  - `GET /users` - Get all users (admin only)
  - `GET /users/:id` - Get user by ID (admin only or self)
  - `PUT /users/:id` - Update user by ID (admin only)
  - `DELETE /users/:id` - Delete user by ID (admin only)

## Seller Module
- **Purpose**: Handle seller profile management (for users with seller role)
- **Endpoints**:
  - `POST /sellers/profile` - Create seller profile (for existing users to become sellers)
  - `GET /sellers/profile` - Get current user's seller profile
  - `PUT /sellers/profile` - Update current user's seller profile
  - `DELETE /sellers/profile` - Delete current user's seller profile
  - `GET /sellers` - Get all sellers (public/admin)
  - `GET /sellers/:id` - Get seller by ID
  - `PUT /sellers/:id/verify` - Verify seller (admin only)
  - `PUT /sellers/:id/activate` - Activate/deactivate seller (admin only)

## Best Practices Implemented

1. **Centralized Authentication**: All auth-related functionality is in the auth module
2. **Role-based Access**: Clear separation of concerns based on user roles
3. **Single Responsibility**: Each module has clear responsibilities
4. **Security**: Proper authentication and authorization on all endpoints
5. **Consistency**: Consistent API design patterns across all modules
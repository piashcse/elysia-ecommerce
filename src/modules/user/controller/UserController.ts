import { Elysia, t } from 'elysia';
import { UserService } from '../service/UserService';
import {
  updateUserSchema,
  changePasswordSchema
} from '../validators/UserValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { UnauthorizedError, NotFoundError } from '../../../core/errors';
import { getCurrentUser, isAuthenticated } from '../../../utils/jwt';
import { comparePassword, hashPassword } from '../../../utils/auth';

const userService = new UserService();

export const userController = new Elysia({ prefix: '/users', tags: ['User'] })
  
  // Get current user profile
  .get(
    '/profile',
    async ({ set, jwt }) => {
      try {
        // Verify JWT token and get user info
        const token = jwt;
        if (!token) {
          set.status = 401;
          return errorResponse('Authentication token required');
        }

        const user = await userService.findUserById(token.sub);
        if (!user) {
          set.status = 404;
          return errorResponse('User not found');
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = user;

        return successResponse(userWithoutPassword, 'Profile retrieved successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { tags: ['User'] }
    }
  )
  
  // Update current user profile
  .put(
    '/profile',
    async ({ body, set, jwt }) => {
      try {
        const token = jwt;
        if (!token) {
          set.status = 401;
          return errorResponse('Authentication token required');
        }

        const validatedData = validate(updateUserSchema, body);
        const updatedUser = await userService.updateUser(token.sub, validatedData);

        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;

        return successResponse(userWithoutPassword, 'Profile updated successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      detail: { tags: ['User'] }
    }
  )
  
  // Change password
  .put(
    '/change-password',
    async ({ body, set, jwt }) => {
      try {
        const token = jwt;
        if (!token) {
          set.status = 401;
          return errorResponse('Authentication token required');
        }

        const validatedData = validate(changePasswordSchema, body);

        const updatedUser = await userService.changePassword(
          token.sub,
          validatedData.currentPassword,
          validatedData.newPassword
        );

        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;

        return successResponse(userWithoutPassword, 'Password changed successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
      }),
      detail: { tags: ['User'] }
    }
  )
  
  // Get all users (admin only)
  .get(
    '/',
    async ({ query, set, jwt }) => {
      try {
        const token = jwt;
        if (!token || token.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }

        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;

        const { users, total } = await userService.getAllUsers(page, limit);

        // Don't return passwords in response
        const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);

        return paginatedResponse(
          usersWithoutPasswords,
          {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          'Users retrieved successfully'
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ['User'] }
    }
  )
  
  // Get user by ID (admin only or self)
  .get(
    '/:id',
    async ({ params, set, jwt }) => {
      try {
        const token = jwt;
        if (!token) {
          set.status = 401;
          return errorResponse('Authentication token required');
        }

        const { id } = params;

        // Allow access if it's the user's own profile or if admin
        if (token.sub !== id && token.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. You can only view your own profile or need admin role.');
        }

        const user = await userService.findUserById(id);
        if (!user) {
          set.status = 404;
          return errorResponse('User not found');
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = user;

        return successResponse(userWithoutPassword, 'User retrieved successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['User'] }
    }
  )
  
  // Update user by ID (admin only)
  .put(
    '/:id',
    async ({ params, body, set, jwt }) => {
      try {
        const token = jwt;
        if (!token || token.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }

        const { id } = params;
        const validatedData = validate(updateUserSchema, body);

        const updatedUser = await userService.updateUser(id, validatedData);

        // Don't return password in response
        const { password, ...userWithoutPassword } = updatedUser;

        return successResponse(userWithoutPassword, 'User updated successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      detail: { tags: ['User'] }
    }
  )
  
  // Deactivate user by ID (admin only) - soft delete
  .put(
    '/:id/deactivate',
    async ({ params, set, jwt }) => {
      try {
        const token = jwt;
        if (!token || token.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }

        const { id } = params;

        await userService.deactivateUser(id);

        return successResponse(null, 'User deactivated successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['User'] }
    }
  )

  // Activate user by ID (admin only)
  .put(
    '/:id/activate',
    async ({ params, set, jwt }) => {
      try {
        const token = jwt;
        if (!token || token.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }

        const { id } = params;

        await userService.activateUser(id);

        return successResponse(null, 'User activated successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { tags: ['User'] }
    }
  );
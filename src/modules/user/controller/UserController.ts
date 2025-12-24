import { Elysia, t } from 'elysia';
import { UserService } from '../service/UserService';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema
} from '../validators/UserValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { jwt } from '@elysiajs/jwt';
import envConfig from '../../../config/env';

const userService = new UserService();

export const userController = new Elysia({ prefix: '/users', tags: ['User'] })
  .use(
    jwt({
      name: 'jwt',
      secret: envConfig.JWT_SECRET,
    })
  )
  .derive(async ({ jwt, headers }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null };
    }
    const token = authHeader.split(' ')[1];
    const payload = await jwt.verify(token);
    return { user: payload };
  })
  // Get current user profile
  .get(
    '/profile',
    async ({ user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return errorResponse('Authentication token required', 'UNAUTHORIZED', 401);
        }

        const userData = await userService.findUserById(user.sub as string);
        if (!userData) {
          set.status = 404;
          return errorResponse('User not found', 'NOT_FOUND', 404);
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = userData;

        return successResponse(userWithoutPassword, 'Profile retrieved successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { summary: 'Get current user profile' }
    }
  )

  // Update current user profile
  .put(
    '/profile',
    async ({ user, body, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return errorResponse('Authentication token required', 'UNAUTHORIZED', 401);
        }

        const validatedData = validate(updateUserSchema, body);
        const updatedUser = await userService.updateUser(user.sub as string, validatedData);

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
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      detail: { summary: 'Update current user profile' }
    }
  )

  // Change password
  .put(
    '/change-password',
    async ({ user, body, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return errorResponse('Authentication token required', 'UNAUTHORIZED', 401);
        }

        const validatedData = validate(changePasswordSchema, body);

        const updatedUser = await userService.changePassword(
          user.sub as string,
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
      detail: { summary: 'Change user password' }
    }
  )

  // Get all users (admin only)
  .get(
    '/',
    async ({ user, query, set }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
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
      detail: { summary: 'Get all users (Admin only)' }
    }
  )

  // Get user by ID (admin only or self)
  .get(
    '/:id',
    async ({ user, params, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return errorResponse('Authentication token required', 'UNAUTHORIZED', 401);
        }

        const { id } = params;

        // Allow access if it's the user's own profile or if admin
        if (user.sub !== id && user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. You can only view your own profile or need admin role.', 'FORBIDDEN', 403);
        }

        const userData = await userService.findUserById(id);
        if (!userData) {
          set.status = 404;
          return errorResponse('User not found', 'NOT_FOUND', 404);
        }

        // Don't return password in response
        const { password, ...userWithoutPassword } = userData;

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
      detail: { summary: 'Get user by ID' }
    }
  )

  // Update user by ID (admin only)
  .put(
    '/:id',
    async ({ user, params, body, set }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
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
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      detail: { summary: 'Update user by ID (Admin only)' }
    }
  )

  // Delete user by ID (admin only)
  .delete(
    '/:id',
    async ({ user, params, set }) => {
      try {
        if (!user || user.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.', 'FORBIDDEN', 403);
        }

        const { id } = params;

        await userService.deleteUser(id);

        return successResponse(null, 'User deleted successfully');
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Delete user by ID (Admin only)' }
    }
  );
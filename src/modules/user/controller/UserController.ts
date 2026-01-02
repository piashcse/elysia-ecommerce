import { Elysia, t } from 'elysia';
import { UserService } from '../service/UserService';
import { changePasswordSchema, updateUserSchema } from '../validators/UserValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const userService = new UserService();

export const userController = new Elysia({ prefix: '/users', tags: ['User'] })
  .use(authPlugin)
  // Get current user profile
  .get(
    '/profile',
    async ({ user, set }) => {
      const userData = await userService.findUserById(user!.sub as string);
      if (!userData) {
        set.status = 404;
        return errorResponse('User not found', 'NOT_FOUND', 404);
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = userData;

      return successResponse(userWithoutPassword, 'Profile retrieved successfully');
    },
    {
      detail: { summary: 'Get current user profile' },
      isAuth: true,
      response: {
        200: t.Object({
          success: t.Boolean(),
          statusCode: t.Number(),
          message: t.String(),
          data: t.Any()
        }),
        404: t.Any()
      }
    }
  )

  // Update current user profile
  .put(
    '/profile',
    async ({ user, body }) => {
      const validatedData = validate(updateUserSchema, body);
      const updatedUser = await userService.updateUser(user!.sub as string, validatedData);

      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;

      return successResponse(userWithoutPassword, 'Profile updated successfully');
    },
    {
      body: t.Object({
        email: t.Optional(t.String()),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      isAuth: true,
      response: {
        200: t.Any(),
        400: t.Any(),
        422: t.Any()
      },
      detail: { summary: 'Update current user profile' }
    }
  )

  // Change password
  .put(
    '/change-password',
    async ({ user, body }) => {
      const validatedData = validate(changePasswordSchema, body);

      const updatedUser = await userService.changePassword(
        user!.sub as string,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;

      return successResponse(userWithoutPassword, 'Password changed successfully');
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
      }),
      isAuth: true,
      response: {
        200: t.Any(),
        400: t.Any(),
        401: t.Any()
      },
      detail: { summary: 'Change user password' }
    }
  )

  // Get all users (admin only)
  .get(
    '/',
    async ({ query }) => {
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
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      hasRole: 'admin',
      response: {
        200: t.Any()
      },
      detail: { summary: 'Get all users (Admin only)' }
    }
  )

  // Get user by ID (admin only or self)
  .get(
    '/:id',
    async ({ user, params, set }) => {
      const { id } = params;

      // Allow access if it's the user's own profile or if admin
      if (user!.sub !== id && user!.role !== 'admin') {
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
    },
    {
      params: t.Object({
        id: t.String()
      }),
      isAuth: true,
      response: {
        200: t.Any(),
        403: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Get user by ID' }
    }
  )

  // Update user by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const { id } = params;
      const validatedData = validate(updateUserSchema, body);

      const updatedUser = await userService.updateUser(id, validatedData);

      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;

      return successResponse(userWithoutPassword, 'User updated successfully');
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
      hasRole: 'admin',
      response: {
        200: t.Any(),
        400: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Update user by ID (Admin only)' }
    }
  )

  // Delete user by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      const { id } = params;

      await userService.deleteUser(id);

      return successResponse(null, 'User deleted successfully');
    },
    {
      params: t.Object({
        id: t.String()
      }),
      hasRole: 'admin',
      response: {
        200: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Delete user by ID (Admin only)' }
    }
  );
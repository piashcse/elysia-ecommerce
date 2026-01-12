import { Elysia, t } from 'elysia';
import { UserService } from '../service/UserService';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

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

      return successResponse(userData, 'Profile retrieved successfully');
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
      const updatedUser = await userService.updateUser(user!.sub as string, body);

      return successResponse(updatedUser, 'Profile updated successfully');
    },
    {
      body: t.Object({
        email: t.Optional(t.String({ format: 'email' })),
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
      // Body is typed by schema, no need to cast to any if we trust inference or interface
      const { currentPassword, newPassword } = body;
      const updatedUser = await userService.changePassword(
        user!.sub as string,
        currentPassword,
        newPassword
      );

      return successResponse(updatedUser, 'Password changed successfully');
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1 }),
        newPassword: t.String({ minLength: 6 }),
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
      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 10;

      const { users, total } = await userService.getAllUsers(page, limit);

      return paginatedResponse(
        users,
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
      hasRole: UserRole.ADMIN,
      response: {
        200: t.Any()
      },
      detail: { summary: 'Get all users (Admin only)' }
    }
  )

  // Get user by ID (admin only or self)
  .get(
    '/:id',
    async ({ params, set }) => {
      const { id } = params;

      const userData = await userService.findUserById(id);
      if (!userData) {
        set.status = 404;
        return errorResponse('User not found', 'NOT_FOUND', 404);
      }

      return successResponse(userData, 'User retrieved successfully');
    },
    {
      params: t.Object({
        id: t.String()
      }),
      isOwner: 'id',
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
      const updatedUser = await userService.updateUser(id, body);

      return successResponse(updatedUser, 'User updated successfully');
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        email: t.Optional(t.String({ format: 'email' })),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      isOwner: 'id',
      response: {
        200: t.Any(),
        400: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Update user by ID (Admin or Self)' }
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
      isOwner: 'id',
      response: {
        200: t.Any(),
        404: t.Any()
      },
      detail: { summary: 'Delete user by ID (Admin or Self)' }
    }
  );

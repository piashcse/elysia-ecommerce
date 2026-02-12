import { Elysia, t } from 'elysia';
import { UserService } from '../service/UserService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const userService = new UserService();

export const userController = new Elysia({ prefix: '/users', tags: ['User'] })
  .use(authPlugin)
  // Get current user profile
  .get(
    '/profile',
    async ({ user }) => {
      const userData = await userService.findByIdOrFail(user!.sub as string, 'User');
      return successResponse(userData, 'Profile retrieved successfully');
    },
    {
      detail: { summary: 'Get current user profile' },
      isAuth: true,
      response: {
        200: successSchema(),
        404: errorSchema
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
        200: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Update current user profile' }
    }
  )

  // Change password
  .put(
    '/change-password',
    async ({ user, body }) => {
      const updatedUser = await userService.changePassword(
        user!.sub as string,
        body.currentPassword,
        body.newPassword
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
        200: successSchema(),
        400: errorSchema,
        401: errorSchema
      },
      detail: { summary: 'Change user password' }
    }
  )

  // Get all users (admin only)
  .get(
    '/',
    async ({ query }) => {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const { items, total } = await userService.findAll(page, limit);

      return paginatedResponse(items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, 'Users retrieved successfully');
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        200: paginatedSchema()
      },
      detail: { summary: 'Get all users (Admin only)' }
    }
  )

  // Get user by ID (admin only or self)
  .get(
    '/:id',
    async ({ params }) => {
      const userData = await userService.findByIdOrFail(params.id, 'User');
      return successResponse(userData, 'User retrieved successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      isOwner: 'id',
      response: {
        200: successSchema(),
        403: errorSchema,
        404: errorSchema
      },
      detail: { summary: 'Get user by ID' }
    }
  )

  // Update user by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const updatedUser = await userService.updateUser(params.id, body);
      return successResponse(updatedUser, 'User updated successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        email: t.Optional(t.String({ format: 'email' })),
        firstName: t.Optional(t.String()),
        lastName: t.Optional(t.String()),
      }),
      isOwner: 'id',
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema
      },
      detail: { summary: 'Update user by ID (Admin or Self)' }
    }
  )

  // Delete user by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      await userService.delete(params.id);
      return successResponse(null, 'User deleted successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      isOwner: 'id',
      response: {
        200: successSchema(t.Null()),
        404: errorSchema
      },
      detail: { summary: 'Delete user by ID (Admin or Self)' }
    }
  );

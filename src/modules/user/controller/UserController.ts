import { Elysia, t } from 'elysia';
import { UserService } from '../service/UserService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams } from '../../../core/schemas';
import { UserRole } from '../../../core/roles';
import { PASSWORD, PAGINATION } from '../../../core/constants';
import { ForbiddenError } from '../../../core/errors';
import { getPagination } from '../../../utils/validation';

const userService = new UserService();

const passwordSchema = t.String({ minLength: PASSWORD.MIN_LENGTH, maxLength: PASSWORD.MAX_LENGTH });

export const userController = new Elysia({ prefix: '/users', tags: ['User'] })
  .use(authPlugin)
  // Create a user with any role (admin only)
  .post('/', {
    body: t.Object({
      email: t.String({ format: 'email', maxLength: 255 }),
      password: passwordSchema,
      firstName: t.Optional(t.String({ maxLength: 100 })),
      lastName: t.Optional(t.String({ maxLength: 100 })),
      role: t.Optional(t.Enum(UserRole)),
    }),
    hasRole: UserRole.ADMIN,
    response: {
      201: successSchema(),
      409: errorSchema,
      422: errorSchema,
    },
    detail: { summary: 'Create a user (Admin only)' }
  }, async ({ body, set }) => {
    const user = await userService.createUser({
      ...body,
      role: body.role as UserRole | undefined,
    } as any);
    set.status = 201;
    return successResponse(user, 'User created successfully', 201);
  })

  // Get current user profile
  .get('/profile', {
    detail: { summary: 'Get current user profile' },
    isAuth: true,
    response: {
      200: successSchema(),
      404: errorSchema
    }
  }, async ({ user }) => {
    const userData = await userService.findByIdOrFail(user!.sub as string, 'User');
    return successResponse(userData, 'Profile retrieved successfully');
  })

  // Update current user profile
  .put('/profile', {
    body: t.Object({
      email: t.Optional(t.String({ format: 'email', maxLength: 255 })),
      firstName: t.Optional(t.String({ maxLength: 100 })),
      lastName: t.Optional(t.String({ maxLength: 100 })),
    }),
    isAuth: true,
    response: {
      200: successSchema(),
      400: errorSchema,
      409: errorSchema,
      422: errorSchema
    },
    detail: { summary: 'Update current user profile' }
  }, async ({ user, body }) => {
    const updatedUser = await userService.updateUser(user!.sub as string, body);
    return successResponse(updatedUser, 'Profile updated successfully');
  })

  // Change password
  .put('/change-password', {
    body: t.Object({
      currentPassword: t.String({ minLength: 1, maxLength: PASSWORD.MAX_LENGTH }),
      newPassword: passwordSchema,
    }),
    isAuth: true,
    response: {
      200: successSchema(t.Null()),
      400: errorSchema,
      403: errorSchema,
      422: errorSchema
    },
    detail: { summary: 'Change user password' }
  }, async ({ user, body }) => {
    await userService.changePassword(
      user!.sub as string,
      body.currentPassword,
      body.newPassword
    );
  
    return successResponse(null, 'Password changed successfully; all sessions have been signed out');
  })

  // Get all users (admin only)
  .get('/', {
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      role: t.Optional(t.Enum(UserRole)),
      search: t.Optional(t.String({ maxLength: 100 })),
    }),
    hasRole: UserRole.ADMIN,
    response: {
      200: paginatedSchema()
    },
    detail: { summary: 'Get all users (Admin only)' }
  }, async ({ query }) => {
    const { page, limit } = getPagination(query);
    const { items, total } = await userService.getUsers(page, limit, {
      role: query.role as UserRole | undefined,
      search: query.search,
    });
  
    return paginatedResponse(items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, 'Users retrieved successfully');
  })

  // GDPR data export
  .get('/me/export', {
    isAuth: true,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Export the current user data' }
  }, async ({ user }) => successResponse(await userService.exportData(user!.sub), 'User data exported successfully'))

  // Delete/anonymize the current account
  .delete('/me', {
    isAuth: true,
    response: { 200: successSchema(t.Null()), 404: errorSchema, 409: errorSchema },
    detail: { summary: 'Delete the current account and anonymize personal data' }
  }, async ({ user }) => {
    await userService.deleteAccount(user!.sub);
    return successResponse(null, 'Account deleted successfully');
  })

  // Get user by ID (admin only or self)
  .get('/:id', {
    params: idParams,
    isOwner: 'id',
    response: {
      200: successSchema(),
      403: errorSchema,
      404: errorSchema
    },
    detail: { summary: 'Get user by ID' }
  }, async ({ params }) => {
    const userData = await userService.findByIdOrFail(params.id, 'User');
    return successResponse(userData, 'User retrieved successfully');
  })

  // Update user by ID (admin can update role/status; self can update profile)
  .put('/:id', {
    params: idParams,
    body: t.Object({
      email: t.Optional(t.String({ format: 'email', maxLength: 255 })),
      firstName: t.Optional(t.String({ maxLength: 100 })),
      lastName: t.Optional(t.String({ maxLength: 100 })),
      role: t.Optional(t.Enum(UserRole)),
      isActive: t.Optional(t.Boolean()),
    }),
    isOwner: 'id',
    response: {
      200: successSchema(),
      400: errorSchema,
      403: errorSchema,
      404: errorSchema,
      409: errorSchema
    },
    detail: { summary: 'Update user by ID (Admin or Self)' }
  }, async ({ params, body, user }) => {
    const isAdmin = user?.role === UserRole.ADMIN;
    if (!isAdmin && (body.role !== undefined || body.isActive !== undefined)) {
      throw new ForbiddenError('Only admins can change roles or account status');
    }
  
    const updatedUser = await userService.updateUser(params.id, body as any);
    return successResponse(updatedUser, 'User updated successfully');
  })

  // Delete user by ID (admin or self, last admin protected)
  .delete('/:id', {
    params: idParams,
    isOwner: 'id',
    response: {
      200: successSchema(t.Null()),
      404: errorSchema,
      409: errorSchema
    },
    detail: { summary: 'Delete user by ID (Admin or Self)' }
  }, async ({ params }) => {
    await userService.deleteUser(params.id);
    return successResponse(null, 'User deleted successfully');
  });

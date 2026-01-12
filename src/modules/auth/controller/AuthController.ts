import { Elysia, t } from 'elysia';
import { AuthService } from '../service/AuthService';
import { successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const authService = new AuthService();

export const authController = new Elysia({ prefix: '/auth', tags: ['Auth'] })
    .use(authPlugin)
    .post(
        '/register',
        async ({ body, set }) => {
            const user = await authService.register({
                ...body,
                role: body.role ?? UserRole.CUSTOMER
            });

            set.status = 201;
            return successResponse(user, 'User registered successfully', 201);
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String({ minLength: 6 }),
                firstName: t.Optional(t.String({ minLength: 1 })),
                lastName: t.Optional(t.String({ minLength: 1 })),
                role: t.Optional(t.Enum(UserRole)),
            }),
            response: {
                201: t.Object({
                    success: t.Boolean(),
                    statusCode: t.Number(),
                    message: t.String(),
                    data: t.Any()
                }),
                400: t.Any(),
                422: t.Any()
            },
            detail: { summary: 'Register a new user' }
        }
    )
    .post(
        '/login',
        async ({ body, jwt }) => {
            const user = await authService.login(body);

            const token = await jwt.sign({
                sub: user.id,
                email: user.email,
                role: user.role,
            });

            return successResponse({ user, token }, 'Login successful');
        },
        {
            body: t.Object({
                email: t.String({ format: 'email' }),
                password: t.String(),
            }),
            response: {
                200: t.Object({
                    success: t.Boolean(),
                    statusCode: t.Number(),
                    message: t.String(),
                    data: t.Object({
                        user: t.Any(),
                        token: t.String()
                    })
                }),
                401: t.Any()
            },
            detail: { summary: 'Login user and get JWT token' }
        }
    );

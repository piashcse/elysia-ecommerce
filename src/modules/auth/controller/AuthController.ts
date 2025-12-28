import {Elysia, t} from 'elysia';
import {AuthService} from '../service/AuthService';
import {createUserSchema, loginUserSchema} from '../../user/validators/UserValidator';
import {validate} from '../../../utils/validation';
import {errorResponse, successResponse} from '../../../core/responses';
import {authPlugin} from '../../../core/auth';

const authService = new AuthService();

export const authController = new Elysia({ prefix: '/auth', tags: ['Auth'] })
    .use(authPlugin)
    .post(
        '/register',
        async ({ body, set }) => {
            try {
                const validatedData = validate(createUserSchema, body);
                const user = await authService.register(validatedData);

                set.status = 201;
                return successResponse(user, 'User registered successfully', 201);
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String(),
                firstName: t.Optional(t.String()),
                lastName: t.Optional(t.String()),
                role: t.Optional(t.Enum({ admin: 'admin', seller: 'seller', customer: 'customer' })),
            }),
            detail: { summary: 'Register a new user' }
        }
    )
    .post(
        '/login',
        async ({ body, set, jwt }) => {
            try {
                const validatedData = validate(loginUserSchema, body);
                const user = await authService.login(validatedData);

                const token = await jwt.sign({
                    sub: user.id,
                    email: user.email,
                    role: user.role,
                });

                return successResponse({ user, token }, 'Login successful');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String(),
            }),
            detail: { summary: 'Login user and get JWT token' }
        }
    );

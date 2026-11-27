import { Elysia, t } from 'elysia';
import { AuthService } from '../service/AuthService';
import { successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { jwtPlugin } from '../../../core/jwt';
import { TOKEN, PASSWORD, JWT_ISSUER, JWT_AUDIENCE } from '../../../core/constants';
import { UnauthorizedError } from '../../../core/errors';
import { JwtPayload } from '../../../utils/jwt';

const authService = new AuthService();

const passwordSchema = t.String({ minLength: PASSWORD.MIN_LENGTH, maxLength: PASSWORD.MAX_LENGTH });

export const authController = new Elysia({ prefix: '/auth', tags: ['Auth'] })
    .use(authPlugin)
    .use(jwtPlugin)
    .post('/register', {
        body: t.Object({
            email: t.String({ format: 'email', maxLength: 255 }),
            password: passwordSchema,
            firstName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
            lastName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        }),
        response: {
            201: t.Object({
                success: t.Boolean(),
                statusCode: t.Number(),
                message: t.String(),
                data: t.Any()
            }),
            400: t.Any(),
            409: t.Any(),
            422: t.Any()
        },
        detail: { summary: 'Register a new customer account' }
    }, async ({ body, set }) => {
        const user = await authService.register(body);
    
        set.status = 201;
        return successResponse(user, 'User registered successfully', 201);
    })
    .post('/login', {
        body: t.Object({
            email: t.String({ format: 'email', maxLength: 255 }),
            password: t.String({ minLength: 1, maxLength: PASSWORD.MAX_LENGTH }),
        }),
        response: {
            200: t.Object({
                success: t.Boolean(),
                statusCode: t.Number(),
                message: t.String(),
                data: t.Object({
                    user: t.Any(),
                    token: t.String(),
                    refreshToken: t.String(),
                })
            }),
            401: t.Any()
        },
        detail: { summary: 'Login user and get access/refresh tokens' }
    }, async ({ body, jwt, request }) => {
        const user = await authService.login(body, {
            userAgent: request.headers.get('user-agent'),
        });
    
        const basePayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            ver: user.tokenVersion,
            iss: JWT_ISSUER,
            aud: JWT_AUDIENCE,
        };
    
        const token = await jwt.sign({
            ...basePayload,
            type: 'access',
            exp: TOKEN.ACCESS_EXPIRY,
            jti: crypto.randomUUID(),
        });
    
        const refreshToken = await jwt.sign({
            ...basePayload,
            type: 'refresh',
            exp: TOKEN.REFRESH_EXPIRY,
            jti: crypto.randomUUID(),
        });
    
        return successResponse({ user, token, refreshToken }, 'Login successful');
    })
    .post('/refresh', {
        body: t.Object({
            refreshToken: t.String({ minLength: 1 }),
        }),
        response: {
            200: t.Object({
                success: t.Boolean(),
                statusCode: t.Number(),
                message: t.String(),
                data: t.Object({
                    token: t.String(),
                    refreshToken: t.String(),
                })
            }),
            401: t.Any()
        },
        detail: { summary: 'Exchange a refresh token for a new token pair' }
    }, async ({ body, jwt }) => {
        const payload = (await jwt.verify(body.refreshToken, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        })) as JwtPayload | false;
    
        if (!payload || payload.type !== 'refresh' || !payload.sub) {
            throw new UnauthorizedError('Invalid refresh token');
        }
    
        const user = await authService.getSessionUser(payload.sub, payload.ver);
    
        const basePayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            ver: user.tokenVersion,
            iss: JWT_ISSUER,
            aud: JWT_AUDIENCE,
        };
    
        const token = await jwt.sign({
            ...basePayload,
            type: 'access',
            exp: TOKEN.ACCESS_EXPIRY,
            jti: crypto.randomUUID(),
        });
    
        const refreshToken = await jwt.sign({
            ...basePayload,
            type: 'refresh',
            exp: TOKEN.REFRESH_EXPIRY,
            jti: crypto.randomUUID(),
        });
    
        return successResponse({ token, refreshToken }, 'Token refreshed successfully');
    })
    .post('/logout', {
        isAuth: true,
        response: { 200: t.Any() },
        detail: { summary: 'Invalidate all sessions for the current user' }
    }, async ({ user }) => {
        await authService.logout(user!.sub);
        return successResponse(null, 'Logged out successfully');
    })
    .post('/verify-email', {
        body: t.Object({ token: t.String({ minLength: 1 }) }),
        response: { 200: t.Any(), 422: t.Any() },
        detail: { summary: 'Verify an email address' }
    }, async ({ body }) => {
        await authService.verifyEmail(body.token);
        return successResponse(null, 'Email verified successfully');
    })
    .post('/resend-verification', {
        isAuth: true,
        response: { 200: t.Any(), 409: t.Any() },
        detail: { summary: 'Resend the email verification link' }
    }, async ({ user }) => {
        await authService.resendVerification(user!.sub);
        return successResponse(null, 'Verification email sent');
    })
    .post('/forgot-password', {
        body: t.Object({ email: t.String({ format: 'email', maxLength: 255 }) }),
        response: { 200: t.Any(), 422: t.Any() },
        detail: { summary: 'Request a password reset email' }
    }, async ({ body }) => {
        await authService.forgotPassword(body.email);
        return successResponse(null, 'If the account exists, a password reset email has been sent');
    })
    .post('/reset-password', {
        body: t.Object({
            token: t.String({ minLength: 1 }),
            password: passwordSchema,
        }),
        response: { 200: t.Any(), 422: t.Any() },
        detail: { summary: 'Reset a password using a reset token' }
    }, async ({ body }) => {
        await authService.resetPassword(body.token, body.password);
        return successResponse(null, 'Password reset successfully');
    });

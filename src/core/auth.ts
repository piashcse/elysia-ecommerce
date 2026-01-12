import {Elysia} from 'elysia';
import {jwt} from '@elysiajs/jwt';
import envConfig from '../config/env';
import {errorResponse} from './responses';
import {JwtPayload} from '../utils/jwt';
import { UserRole } from './roles';

export const authPlugin = new Elysia({ name: 'auth-plugin' })
    .use(
        jwt({
            name: 'jwt',
            secret: envConfig.JWT_SECRET,
        })
    )
    .derive({ as: 'global' }, async ({ jwt, headers }): Promise<{ user: JwtPayload | null }> => {
        const authHeader = headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { user: null };
        }
        const token = authHeader.split(' ')[1];
        try {
            const payload = await jwt.verify(token);
            if (!payload) return { user: null };
            return { user: payload as unknown as JwtPayload };
        } catch (error) {
            return { user: null };
        }
    })
    .macro(({ onBeforeHandle }) => ({
        isAuth: (enabled: boolean) => {
            if (!enabled) return;
            onBeforeHandle(({ user, set }: { user: JwtPayload | null, set: any }) => {
                if (!user) {
                    set.status = 401;
                    return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
                }
                return;
            });
        },
        hasRole: (role: UserRole | UserRole[]) => {
            onBeforeHandle(({ user, set }: { user: JwtPayload | null, set: any }) => {
                if (!user) {
                    set.status = 401;
                    return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
                }
                
                const roles = Array.isArray(role) ? role : [role];
                if (!roles.includes(user.role as UserRole)) {
                    set.status = 403;
                    return errorResponse(`Access denied. ${roles.join(' or ')} role required.`, 'FORBIDDEN', 403);
                }
                return;
            });
        },
        isOwner: (paramName: string = 'id') => {
            onBeforeHandle(({ user, params, set }: { user: JwtPayload | null, params: any, set: any }) => {
                if (!user) {
                    set.status = 401;
                    return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
                }
                if (user.role !== UserRole.ADMIN && user.sub !== params[paramName]) {
                    set.status = 403;
                    return errorResponse('Access denied. Ownership or admin role required.', 'FORBIDDEN', 403);
                }
                return;
            });
        },
    }));

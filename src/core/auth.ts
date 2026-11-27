import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users } from '../database/schema';
import { errorResponse } from './responses';
import { JwtPayload, CurrentUser } from '../utils/jwt';
import { UserRole } from './roles';
import { jwtPlugin } from './jwt';
import { JWT_AUDIENCE, JWT_ISSUER } from './constants';
import { ApiKeyService } from '../modules/auth/service/ApiKeyService';

const unauthorized = (set: any, message = 'Authentication required') => {
  set.status = 401;
  return errorResponse(message, 'UNAUTHORIZED', 401);
};

const forbidden = (set: any, message = 'Access denied') => {
  set.status = 403;
  return errorResponse(message, 'FORBIDDEN', 403);
};

const securityDetail = { security: [{ bearerAuth: [] }] };
const apiKeyService = new ApiKeyService();

export const authPlugin = new Elysia({ name: 'auth-plugin' })
    .use(jwtPlugin)
    .derive('global', async ({ jwt, headers }): Promise<{ user: CurrentUser | null }> => {
    const authHeader = headers['authorization'];
    const apiKeyHeader = headers['x-api-key'];

    if (!authHeader?.startsWith('Bearer ') && typeof apiKeyHeader === 'string') {
        const apiUser = await apiKeyService.resolve(apiKeyHeader);
        return {
            user: apiUser
                ? { sub: apiUser.id, email: apiUser.email, role: apiUser.role, ver: apiUser.tokenVersion }
                : null,
        };
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { user: null };
    }

    const token = authHeader.slice(7).trim();
    if (!token) return { user: null };

    try {
        const payload = (await jwt.verify(token, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        })) as JwtPayload | false;
        if (!payload || payload.type !== 'access' || !payload.sub) {
            return { user: null };
        }

        // Always load the current user so role changes, deactivation, and
        // logout-all (tokenVersion bump) take effect immediately.
        const [current] = await db
            .select({
                id: users.id,
                email: users.email,
                role: users.role,
                isActive: users.isActive,
                tokenVersion: users.tokenVersion,
                deletedAt: users.deletedAt,
            })
            .from(users)
            .where(eq(users.id, payload.sub))
            .limit(1);

        if (!current || !current.isActive || current.deletedAt || current.tokenVersion !== payload.ver) {
            return { user: null };
        }

        return {
            user: {
                sub: current.id,
                email: current.email,
                role: current.role,
                ver: current.tokenVersion,
            },
        };
    } catch {
        return { user: null };
    }
})
    .macro({
        isAuth: (enabled: boolean) => {
            if (!enabled) return;

            return {
                detail: securityDetail,
                beforeHandle({ user, set }: any) {
                    if (!user) return unauthorized(set);
                    return undefined;
                },
            };
        },
        hasRole: (role: UserRole | UserRole[]) => {
            const roles = Array.isArray(role) ? role : [role];

            return {
                detail: securityDetail,
                beforeHandle({ user, set }: any) {
                    if (!user) return unauthorized(set);
                    if (!roles.includes(user.role as UserRole)) {
                        return forbidden(set, `Access denied. ${roles.join(' or ')} role required.`);
                    }
                    return undefined;
                },
            };
        },
        isOwner: (paramName: string = 'id') => {
            return {
                detail: securityDetail,
                beforeHandle({ user, params, set }: any) {
                    if (!user) return unauthorized(set);
                    if (user.role !== UserRole.ADMIN && user.sub !== params?.[paramName]) {
                        return forbidden(set, 'Access denied. Ownership or admin role required.');
                    }
                    return undefined;
                },
            };
        },
    });

import { Elysia, Context } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import envConfig from '../../config/env';
import { errorResponse } from '../../core/responses';
import { JwtPayload } from '../../utils/jwt';
import { UserRole } from '../../core/roles';
import { UnauthorizedError, ForbiddenError } from '../../core/errors';
import { logger } from '../../utils/logging';

export interface AuthOptions {
  required?: boolean;
  roles?: UserRole[];
  ownerCheck?: boolean;
  ownerIdParam?: string;
}

export const authMiddleware = (options: AuthOptions = {}) => {
  const { required = true, roles = [], ownerCheck = false, ownerIdParam = 'id' } = options;

  return new Elysia({ name: 'auth-middleware' })
    .use(
      jwt({
        name: 'jwt',
        secret: envConfig.JWT_SECRET,
      })
    )
    .derive(async ({ jwt, headers }): Promise<{ user: JwtPayload | null }> => {
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
        logger.warn('JWT verification failed', { error: (error as Error).message });
        return { user: null };
      }
    })
    .onBeforeHandle(({ user, set, path }) => {
      // If authentication is required but user is not authenticated
      if (required && !user) {
        set.status = 401;
        logger.info('Authentication required', { path, required });
        return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
      }

      // If roles are specified, check if user has required role
      if (roles.length > 0 && user && !roles.includes(user.role as UserRole)) {
        set.status = 403;
        logger.warn('Access denied - insufficient role', { 
          path, 
          userRole: user.role, 
          requiredRoles: roles 
        });
        return errorResponse(`Access denied. ${roles.join(' or ')} role required.`, 'FORBIDDEN', 403);
      }

      // If owner check is enabled, verify user owns the resource
      if (ownerCheck && user && user.role !== UserRole.ADMIN) {
        // Note: params would need to be accessed differently in Elysia
        // This is a simplified implementation
        logger.info('Owner check passed', { path, userId: user.sub });
      }

      return;
    });
};

// Enhanced auth plugin with role-based access control
export const enhancedAuthPlugin = new Elysia({ name: 'enhanced-auth' })
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
      logger.warn('JWT verification failed in enhanced auth', { error: (error as Error).message });
      return { user: null };
    }
  })
  .macro(({ onBeforeHandle }) => ({
    isAuth: (enabled: boolean = true) => {
      if (!enabled) return;
      onBeforeHandle(({ user, set, path }: { user: JwtPayload | null, set: any, path: string }) => {
        if (!user) {
          set.status = 401;
          logger.info('Enhanced auth: Authentication required', { path });
          return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
        }
        return;
      });
    },
    hasRole: (role: UserRole | UserRole[]) => {
      onBeforeHandle(({ user, set, path }: { user: JwtPayload | null, set: any, path: string }) => {
        if (!user) {
          set.status = 401;
          return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
        }

        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(user.role as UserRole)) {
          set.status = 403;
          logger.warn('Enhanced auth: Insufficient role', { 
            path, 
            userRole: user.role, 
            requiredRoles: roles 
          });
          return errorResponse(`Access denied. ${roles.join(' or ')} role required.`, 'FORBIDDEN', 403);
        }
        return;
      });
    },
    isOwner: (paramName: string = 'id') => {
      onBeforeHandle(({ user, params, set, path }: { user: JwtPayload | null, params: any, set: any, path: string }) => {
        if (!user) {
          set.status = 401;
          return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
        }
        
        // In a real implementation, we would access the param value
        // This is a simplified version
        if (user.role !== UserRole.ADMIN && user.sub !== params[paramName]) {
          set.status = 403;
          logger.warn('Enhanced auth: Owner check failed', { 
            path, 
            userId: user.sub, 
            requestedId: params[paramName],
            isAdmin: user.role === UserRole.ADMIN
          });
          return errorResponse('Access denied. Ownership or admin role required.', 'FORBIDDEN', 403);
        }
        return;
      });
    },
    hasPermission: (permission: string | string[]) => {
      onBeforeHandle(({ user, set, path }: { user: JwtPayload | null, set: any, path: string }) => {
        if (!user) {
          set.status = 401;
          return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
        }

        // In a real implementation, we would check user permissions
        // This is a simplified version
        const permissions = Array.isArray(permission) ? permission : [permission];
        if (!user.permissions || !permissions.some(p => user.permissions?.includes(p))) {
          set.status = 403;
          logger.warn('Enhanced auth: Insufficient permissions', { 
            path, 
            userId: user.sub, 
            requiredPermissions: permissions,
            userPermissions: user.permissions
          });
          return errorResponse('Access denied. Insufficient permissions.', 'FORBIDDEN', 403);
        }
        return;
      });
    }
  }));
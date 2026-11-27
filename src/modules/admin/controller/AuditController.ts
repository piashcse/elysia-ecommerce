import { Elysia, t } from 'elysia';
import { AuditService } from '../service/AuditService';
import { paginatedResponse, paginatedSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';
import { uuid } from '../../../core/schemas';

const service = new AuditService();

export const auditController = new Elysia({ prefix: '/admin/audit-logs', tags: ['Admin'] })
  .use(authPlugin)
  .get('/', {
    hasRole: UserRole.ADMIN,
    query: t.Object({
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      userId: t.Optional(uuid),
      path: t.Optional(t.String({ maxLength: 200 })),
    }),
    response: { 200: paginatedSchema() },
    detail: { summary: 'List audit logs (Admin only)' }
  }, async ({ query }) => {
    const { page, limit } = getPagination(query);
    const { items, total } = await service.list(page, limit, { userId: query.userId, path: query.path });
    return paginatedResponse(items, { page, limit, total, totalPages: Math.ceil(total / limit) }, 'Audit logs retrieved successfully');
  });

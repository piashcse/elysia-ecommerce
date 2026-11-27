import { Elysia, t } from 'elysia';
import { ReportService } from '../service/ReportService';
import { successResponse, successSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const service = new ReportService();

export const reportController = new Elysia({ prefix: '/admin/reports', tags: ['Admin'] })
  .use(authPlugin)
  .get('/sales', {
    hasRole: UserRole.ADMIN,
    query: t.Object({
      from: t.Optional(t.String({ format: 'date-time' })),
      to: t.Optional(t.String({ format: 'date-time' })),
    }),
    response: { 200: successSchema() },
    detail: { summary: 'Sales and product reports (Admin only)' }
  }, async ({ query }) => successResponse(await service.sales(query.from, query.to), 'Sales report retrieved successfully'));

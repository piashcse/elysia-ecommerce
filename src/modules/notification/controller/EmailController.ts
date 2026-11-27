import { Elysia, t } from 'elysia';
import { EmailService } from '../service/EmailService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const emailService = new EmailService();

export const emailController = new Elysia({ prefix: '/emails', tags: ['Notification'] })
  .use(authPlugin)
  .get('/', {
    hasRole: UserRole.ADMIN,
    query: t.Object({ limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })) }),
    response: { 200: successSchema() },
    detail: { summary: 'List the email outbox (Admin only)' }
  }, async ({ query }) => successResponse(await emailService.list(query.limit), 'Email outbox retrieved successfully'))
  .post('/process', {
    hasRole: UserRole.ADMIN,
    body: t.Optional(t.Object({ limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })) })),
    response: { 200: successSchema(), 422: errorSchema },
    detail: { summary: 'Process pending emails (Admin only)' }
  }, async ({ body }) => {
    const result = await emailService.process(body?.limit);
    return successResponse(result, 'Email outbox processed successfully');
  });

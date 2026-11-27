import { Elysia } from 'elysia';
import { AuditService } from '../service/AuditService';

const audit = new AuditService();
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const auditMiddleware = new Elysia({ name: 'audit' })
  .onAfterResponse('global', (ctx: any) => {
    if (!MUTATING.has(ctx.request.method)) return;
    const path = new URL(ctx.request.url).pathname;
    if (path.startsWith('/payments/webhook') || path.startsWith('/swagger')) return;

    void audit.log({
      userId: ctx.user?.sub ?? null,
      method: ctx.request.method,
      path,
      status: ctx.set.status,
      ip: ctx.server?.requestIP?.(ctx.request)?.address,
    }).catch(() => undefined);
  });

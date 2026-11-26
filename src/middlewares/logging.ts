import { Elysia } from 'elysia';
import pino from 'pino';
import envConfig from '../config/env';

const logger = pino({
  level: envConfig.NODE_ENV === 'test' ? 'silent' : envConfig.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'request.headers.authorization'],
    censor: '[REDACTED]',
  },
});

/**
 * Minimal request logger for Elysia 2.
 *
 * Error contexts are intentionally not logged here: the centralized error
 * handler emits a redacted summary and Elysia validation errors can contain the
 * submitted body.
 */
export const loggingMiddleware = new Elysia({ name: 'logging' })
  .onAfterResponse('global', ({ request, set }) => {
    if (envConfig.NODE_ENV === 'test') return;

    const path = new URL(request.url).pathname;
    if (path === '/health') return;

    logger.info(
      {
        method: request.method,
        path,
        status: set.status ?? 200,
        requestId: set.headers['X-Request-ID'],
        userAgent: request.headers.get('user-agent'),
      },
      'request'
    );
  });

import { Elysia } from 'elysia';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RATE_LIMIT } from '../core/constants';
import { errorResponse } from '../core/responses';
import envConfig from '../config/env';

const defaultLimiter = new RateLimiterMemory(RATE_LIMIT.DEFAULT);
const authLimiter = new RateLimiterMemory(RATE_LIMIT.AUTH);

const getClientIp = (request: Request, server: any): string => {
  if (envConfig.TRUST_PROXY) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]!.trim();
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();
  }

  const ip = server?.requestIP?.(request);
  return ip?.address ?? 'unknown';
};

export const rateLimiterMiddleware = new Elysia({ name: 'rate-limiter' }).onBeforeHandle('global', async ({ request, server, set }) => {
  // Rate limiting is disabled under test to keep the suite deterministic.
  if (envConfig.NODE_ENV === 'test') return;

  const path = new URL(request.url).pathname;
  const limiter = path.startsWith('/auth') ? authLimiter : defaultLimiter;
  const key = getClientIp(request, server);

  try {
    const result = await limiter.consume(key, 1);
    set.headers['X-RateLimit-Limit'] = String(limiter.points);
    set.headers['X-RateLimit-Remaining'] = String(result.remainingPoints);
    set.headers['X-RateLimit-Reset'] = String(Math.ceil((Date.now() + result.msBeforeNext) / 1000));
    return undefined;
  } catch (rejection: any) {
    const retryAfter = Math.max(1, Math.ceil((rejection?.msBeforeNext ?? 1000) / 1000));
    set.status = 429;
    set.headers['Retry-After'] = String(retryAfter);
    set.headers['X-RateLimit-Limit'] = String(limiter.points);
    set.headers['X-RateLimit-Remaining'] = '0';
    return errorResponse('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, {
      retryAfter,
    });
  }
});

export const defaultRateLimiter = rateLimiterMiddleware;

import {Elysia} from 'elysia';
import {RateLimiterMemory} from 'rate-limiter-flexible';

// Create a rate limiter instance
const opts = {
  points: 10, // Number of points (requests)
  duration: 60, // Per 60 seconds
};

const rateLimiter = new RateLimiterMemory(opts);

export const rateLimiterMiddleware = (points: number = 10, duration: number = 60) => {
  const limiter = new RateLimiterMemory({
    points,
    duration,
  });

  return new Elysia({ name: 'rateLimiter' })
    .derive(async ({ request, set }) => {
      const clientIP = request.headers.get('x-forwarded-for') ||
                       request.headers.get('x-real-ip') ||
                       request.headers.get('x-client-ip') ||
                       request.headers.get('cf-connecting-ip') ||
                       (request.socket?.remoteAddress || 'Unknown IP').split(',')[0].trim();

      try {
        await limiter.consume(clientIP, 1); // Consume 1 point per request
        return { ip: clientIP };
      } catch (rejRes) {
        set.status = 429;
        return {
          success: false,
          message: 'Too Many Requests',
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }
    });
};

// Default rate limiter with 10 requests per minute
export const defaultRateLimiter = rateLimiterMiddleware();
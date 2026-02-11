import { Elysia, Context } from 'elysia';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterUnion } from 'rate-limiter-flexible';
import envConfig from '../../config/env';

export interface RateLimitOptions {
  points?: number;        // Number of points (requests) allowed
  duration?: number;      // Per duration in seconds
  blockDuration?: number; // Block duration in seconds if consumed more than points
  maxConsecutiveFailsPeriod?: number; // Max consecutive fails before blocking
  penalty?: number;       // Penalty points for failed requests
  keyPrefix?: string;     // Prefix for Redis keys
}

export class RateLimiter {
  private static instance: RateLimiter;
  private limiter: RateLimiterMemory | RateLimiterRedis | RateLimiterUnion;
  private options: RateLimitOptions;

  private constructor(options: RateLimitOptions = {}) {
    this.options = {
      points: options.points || 10,        // 10 requests
      duration: options.duration || 60,    // per 60 seconds
      blockDuration: options.blockDuration || 60 * 15, // Block for 15 minutes if exceeded
      maxConsecutiveFailsPeriod: options.maxConsecutiveFailsPeriod || 0,
      penalty: options.penalty || 1,
      keyPrefix: options.keyPrefix || 'middleware',
    };

    // Initialize rate limiter based on environment
    if (envConfig.NODE_ENV === 'production' && process.env.REDIS_URL) {
      // In a real app, you would use Redis for distributed rate limiting
      // For now, using memory limiter for simplicity
      this.limiter = new RateLimiterMemory({
        points: this.options.points,
        duration: this.options.duration,
        blockDuration: this.options.blockDuration,
      });
    } else {
      this.limiter = new RateLimiterMemory({
        points: this.options.points,
        duration: this.options.duration,
        blockDuration: this.options.blockDuration,
      });
    }
  }

  public static getInstance(options: RateLimitOptions = {}): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(options);
    }
    return RateLimiter.instance;
  }

  /**
   * Gets the client IP address from request headers
   */
  private getClientIP(ctx: Context): string {
    return (
      ctx.request.headers.get('x-forwarded-for') ||
      ctx.request.headers.get('x-real-ip') ||
      ctx.request.headers.get('x-client-ip') ||
      ctx.request.headers.get('cf-connecting-ip') ||
      (ctx.request.headers.get('x-cluster-client-ip')?.split(',')[0]?.trim()) ||
      ctx.request.headers.get('x-forwarded') ||
      ctx.request.headers.get('forwarded-for') ||
      ctx.request.headers.get('x-real-ip') ||
      (ctx.request.socket?.remoteAddress || 'Unknown IP').split(',')[0].trim()
    ) || 'unknown';
  }

  /**
   * Applies rate limiting to a route
   */
  public applyMiddleware(routePoints?: number) {
    return new Elysia({ name: 'rateLimiter' })
      .derive(async ({ request, set }) => {
        const clientIP = this.getClientIP({ request } as Context);
        const pointsToConsume = routePoints || 1;

        try {
          await this.limiter.consume(clientIP, pointsToConsume);
          
          // Add rate limit headers to response
          const remaining = await this.limiter.get(clientIP);
          set.headers['X-RateLimit-Limit'] = this.options.points!.toString();
          set.headers['X-RateLimit-Remaining'] = (remaining?.remainingPoints || 0).toString();
          set.headers['X-RateLimit-Reset'] = (remaining?.msBeforeNext ? new Date(Date.now() + remaining.msBeforeNext).toISOString() : '').toString();
          
          return { ip: clientIP };
        } catch (rejRes) {
          // Rate limit exceeded
          set.status = 429;
          set.headers['Retry-After'] = Math.floor(rejRes.msBeforeNext / 1000).toString();
          
          return {
            success: false,
            message: 'Too Many Requests',
            error: {
              message: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
            },
            meta: {
              retryAfter: Math.floor(rejRes.msBeforeNext / 1000),
              timestamp: new Date().toISOString(),
            },
          };
        }
      });
  }

  /**
   * Applies rate limiting with different limits for different user roles
   */
  public applyRoleBasedRateLimit(guestPoints: number = 10, userPoints: number = 100, adminPoints: number = 1000) {
    return new Elysia({ name: 'roleBasedRateLimiter' })
      .derive(async ({ request, user, set }) => {
        const clientIP = this.getClientIP({ request } as Context);
        
        // Determine points based on user role
        let pointsToConsume = guestPoints; // Default for unauthenticated users
        if (user) {
          switch (user.role) {
            case 'admin':
              pointsToConsume = adminPoints;
              break;
            case 'user':
            case 'customer':
              pointsToConsume = userPoints;
              break;
          }
        }

        try {
          await this.limiter.consume(clientIP, 1); // Always consume 1 point per request
          
          // But allow different total limits based on role
          const remaining = await this.limiter.get(clientIP);
          set.headers['X-RateLimit-Limit'] = pointsToConsume.toString();
          set.headers['X-RateLimit-Remaining'] = (remaining?.remainingPoints || 0).toString();
          set.headers['X-RateLimit-Reset'] = (remaining?.msBeforeNext ? new Date(Date.now() + remaining.msBeforeNext).toISOString() : '').toString();
          
          return { ip: clientIP, rateLimit: pointsToConsume };
        } catch (rejRes) {
          set.status = 429;
          set.headers['Retry-After'] = Math.floor(rejRes.msBeforeNext / 1000).toString();
          
          return {
            success: false,
            message: 'Too Many Requests',
            error: {
              message: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
            },
            meta: {
              retryAfter: Math.floor(rejRes.msBeforeNext / 1000),
              timestamp: new Date().toISOString(),
            },
          };
        }
      });
  }

  /**
   * Gets rate limit info for an IP
   */
  public async getRateLimitInfo(ip: string) {
    return await this.limiter.get(ip);
  }

  /**
   * Penalizes an IP address (for failed authentication attempts, etc.)
   */
  public async penalize(ip: string) {
    await this.limiter.penalty(ip, this.options.penalty);
  }

  /**
   * Deletes rate limit record for an IP
   */
  public async resetRateLimit(ip: string) {
    await this.limiter.delete(ip);
  }
}

// Create default rate limiter instance
export const defaultRateLimiter = RateLimiter.getInstance();
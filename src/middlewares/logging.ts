import { Elysia } from 'elysia';
import winston from 'winston';

// Create a Winston logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'elysia-ecommerce' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export const loggingMiddleware = new Elysia({ name: 'logging' })
  .derive(({ request }) => {
    const startTime = Date.now();

    // Store start time in request context for duration calculation
    (request as any).startTime = startTime;

    // Log incoming request
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
      },
    });

    return { logger, startTime };
  })
  .onAfterHandle(({ request, set }) => {
    const startTime = (request as any).startTime || Date.now();
    const duration = Date.now() - startTime;

    // Log outgoing response
    logger.info('Request completed', {
      method: request.method,
      url: request.url,
      statusCode: set.status || 200,
      duration: `${duration}ms`,
    });
  });
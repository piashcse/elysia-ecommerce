import { Elysia } from 'elysia';

export const helmetMiddleware = new Elysia({ name: 'helmet' })
  .onBeforeHandle(({ set }) => {
    // Set basic security headers
    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['X-XSS-Protection'] = '1; mode=block';
    set.headers['Referrer-Policy'] = 'no-referrer';

    // Strict-Transport-Security
    set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';

    // Content Security Policy
    set.headers['Content-Security-Policy'] =
      "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: https:;";
  });
import { Elysia } from 'elysia';
import envConfig from '../config/env';

export const helmetMiddleware = new Elysia({ name: 'helmet' })
  .onBeforeHandle({ as: 'global' }, ({ set, request }) => {
    const path = new URL(request.url).pathname;

    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['Referrer-Policy'] = 'no-referrer';
    set.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
    set.headers['Cross-Origin-Opener-Policy'] = 'same-origin';

    if (envConfig.NODE_ENV === 'production') {
      set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // Swagger UI relies on inline scripts/styles; keep the API CSP strict but
    // do not break the docs page.
    if (!path.startsWith('/swagger') && !path.startsWith('/docs')) {
      set.headers['Content-Security-Policy'] =
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
    }
  });

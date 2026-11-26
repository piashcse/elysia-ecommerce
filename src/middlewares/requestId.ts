import { Elysia } from 'elysia';

/**
 * Request ID middleware. Must be registered before controllers so its
 * `onBeforeHandle` hook applies to every route.
 */
export const requestIdMiddleware = new Elysia({ name: 'request-id' })
  .onBeforeHandle({ as: 'global' }, ({ set }) => {
    set.headers['X-Request-ID'] = crypto.randomUUID();
  });

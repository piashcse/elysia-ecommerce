import { jwt } from '@elysiajs/jwt';
import envConfig from '../config/env';

/**
 * Single JWT plugin instance shared by the server, auth plugin, and controllers.
 * Sharing the instance keeps Elysia type inference intact (`jwt` visible in context)
 * and avoids registering duplicate plugins with the same name.
 */
export const jwtPlugin = jwt({
  name: 'jwt',
  secret: envConfig.JWT_SECRET,
});

export default jwtPlugin;

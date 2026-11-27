import { CurrentUser } from '../../utils/jwt';

export interface CartOwner {
  userId?: string;
  sessionId?: string;
}

export const resolveCartOwner = (
  user: CurrentUser | null,
  headers: Record<string, unknown>,
  set: { headers: Record<string, any> }
): CartOwner => {
  if (user) return { userId: user.sub };

  const header = headers['x-session-id'];
  const sessionId = typeof header === 'string' && header.length >= 8 ? header : crypto.randomUUID();
  set.headers['X-Session-Id'] = sessionId;
  return { sessionId };
};

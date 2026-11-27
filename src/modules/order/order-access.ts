import { sha256Hash } from '../../utils/auth';
import { UserRole } from '../../core/roles';

export const canAccessOrder = (order: any, user: any, guestToken?: string) =>
  user
    ? user.role === UserRole.ADMIN || order.userId === user.sub
    : Boolean(guestToken && order.guestTokenHash && order.guestTokenHash === sha256Hash(guestToken));

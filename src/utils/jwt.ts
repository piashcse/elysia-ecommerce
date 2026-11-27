import { UserRole } from '../core/roles';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  ver: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface CurrentUser {
  sub: string;
  email: string;
  role: UserRole;
  ver: number;
  scopes?: string[];
  authType?: 'jwt' | 'apiKey';
}

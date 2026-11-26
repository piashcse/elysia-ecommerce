import app from '../server';
import { db } from '../config/database';
import { users } from '../database/schema';
import { UserRole } from '../core/roles';
import { hashPassword } from '../utils/auth';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ApiResult<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

let counter = 0;

export const uniqueEmail = (prefix = 'test'): string => {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}@test.local`;
};

export const createUser = async (
  role: UserRole = UserRole.CUSTOMER,
  overrides: Partial<TestUser> = {}
): Promise<TestUser> => {
  const password = overrides.password ?? 'Password123!';
  const email = overrides.email ?? uniqueEmail(role);

  const [user] = await db
    .insert(users)
    .values({
      email,
      password: await hashPassword(password),
      role,
      emailVerified: true,
      firstName: overrides.email ? 'Test' : role,
      lastName: 'User',
    })
    .returning();

  if (!user) throw new Error('Failed to create test user');

  return { id: user.id, email, password, role };
};

export const login = async (user: TestUser): Promise<string> => {
  const result = await api('/auth/login', {
    method: 'POST',
    body: { email: user.email, password: user.password },
  });

  if (result.status !== 200) {
    throw new Error(`Login failed for ${user.email}: ${JSON.stringify(result.body)}`);
  }

  return result.body.data.token;
};

export const createAndLogin = async (
  role: UserRole = UserRole.CUSTOMER,
  overrides: Partial<TestUser> = {}
): Promise<{ user: TestUser; token: string }> => {
  const user = await createUser(role, overrides);
  const token = await login(user);
  return { user, token };
};

export const createAdmin = () => createAndLogin(UserRole.ADMIN);
export const createCustomer = () => createAndLogin(UserRole.CUSTOMER);
export const createSeller = () => createAndLogin(UserRole.SELLER);

export const api = async <T = any>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResult<T>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  );

  let body: any = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { status: response.status, body, headers: response.headers };
};

export const expectStatus = (result: ApiResult, status: number) => {
  if (result.status !== status) {
    throw new Error(`Expected ${status}, got ${result.status}: ${JSON.stringify(result.body)}`);
  }
};

export const createCategory = async (adminToken: string, name = `Category ${Date.now()}`) => {
  const result = await api('/categories', {
    method: 'POST',
    token: adminToken,
    body: { name },
  });
  if (result.status !== 201) throw new Error(`Category creation failed: ${JSON.stringify(result.body)}`);
  return result.body.data;
};

export const createProduct = async (
  adminToken: string,
  sellerId: string,
  categoryId: string,
  overrides: Record<string, unknown> = {}
) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const result = await api('/products', {
    method: 'POST',
    token: adminToken,
    body: {
      name: `Product ${suffix}`,
      price: 10,
      stockQuantity: 5,
      sku: `SKU-${suffix}`,
      categoryId,
      sellerId,
      ...overrides,
    },
  });
  if (result.status !== 201) throw new Error(`Product creation failed: ${JSON.stringify(result.body)}`);
  return result.body.data;
};

export const address = {
  firstName: 'Test',
  lastName: 'Customer',
  address: '1 Test Street',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  country: 'Testland',
};

export { app };

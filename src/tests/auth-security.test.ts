import { describe, expect, test } from 'bun:test';
import { api, createAdmin, createCustomer, createUser, login } from './helpers';

import { UserRole } from '../core/roles';

describe('Security and authentication', () => {
  test('public registration always creates a customer', async () => {
    const email = `role-test-${Date.now()}@test.local`;
    const result = await api('/auth/register', {
      method: 'POST',
      body: { email, password: 'Password123!', role: 'admin' },
    });

    expect(result.status).toBe(201);
    expect(result.body.data.role).toBe(UserRole.CUSTOMER);
    expect(result.body.data.password).toBeUndefined();
    expect(result.body.data.tokenVersion).toBeUndefined();
  });

  test('protected endpoints reject unauthenticated requests', async () => {
    for (const path of [
      '/users',
      '/coupons',
      '/orders',
      '/cart',
      '/wishlist',
      '/notifications',
      '/seller/products',
      '/payments',
      '/addresses',
    ]) {
      const result = await api(path);
      expect(result.status).toBe(401);
    }

    const products = await api('/products');
    expect(products.status).toBe(200);
  });

  test('admin can create privileged users but customers cannot', async () => {
    const { token: adminToken } = await createAdmin();
    const created = await api('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        email: `new-seller-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.local`,
        password: 'Password123!',
        role: UserRole.SELLER,
      },
    });

    expect(created.status).toBe(201);
    expect(created.body.data.role).toBe(UserRole.SELLER);

    const { token: customerToken } = await createCustomer();
    const denied = await api('/users', {
      method: 'POST',
      token: customerToken,
      body: {
        email: `denied-${Date.now()}@test.local`,
        password: 'Password123!',
        role: UserRole.ADMIN,
      },
    });

    expect(denied.status).toBe(403);
  });

  test('users cannot promote themselves', async () => {
    const { user, token } = await createCustomer();
    const result = await api(`/users/${user.id}`, {
      method: 'PUT',
      token,
      body: { role: UserRole.ADMIN },
    });

    expect(result.status).toBe(403);
    expect(result.body.error.code).toBe('FORBIDDEN');
  });

  test('deactivation and logout invalidate existing access tokens', async () => {
    const { token: adminToken } = await createAdmin();
    const customer = await createUser(UserRole.CUSTOMER);
    const customerToken = await login(customer);

    const deactivated = await api(`/users/${customer.id}`, {
      method: 'PUT',
      token: adminToken,
      body: { isActive: false },
    });
    expect(deactivated.status).toBe(200);

    const afterDeactivation = await api('/users/profile', { token: customerToken });
    expect(afterDeactivation.status).toBe(401);

    const { token: logoutToken } = await createCustomer();
    const logout = await api('/auth/logout', { method: 'POST', token: logoutToken });
    expect(logout.status).toBe(200);

    const afterLogout = await api('/users/profile', { token: logoutToken });
    expect(afterLogout.status).toBe(401);
  });

  test('refresh tokens rotate and invalid refresh tokens are rejected', async () => {
    const customer = await createUser(UserRole.CUSTOMER);
    const loginResult = await api('/auth/login', {
      method: 'POST',
      body: { email: customer.email, password: customer.password },
    });

    expect(loginResult.status).toBe(200);
    const refreshToken = loginResult.body.data.refreshToken;
    expect(typeof refreshToken).toBe('string');

    const refreshed = await api('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.data.token).toBe('string');

    const invalid = await api('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: 'not-a-token' },
    });
    expect(invalid.status).toBe(401);
  });

  test('access tokens include expiry, issuer, and audience', async () => {
    const customer = await createUser(UserRole.CUSTOMER);
    const result = await api('/auth/login', {
      method: 'POST',
      body: { email: customer.email, password: customer.password },
    });

    const token = result.body.data.token as string;
    const payloadPart = token.split('.')[1]!;
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());

    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(payload.iss).toBe('elysia-ecommerce');
    expect(payload.aud).toBe('elysia-ecommerce-api');
    expect(payload.type).toBe('access');
  });

  test('validation errors do not echo secrets and never leak SQL', async () => {
    const secret = 'SHORT';
    const validation = await api('/auth/register', {
      method: 'POST',
      body: { email: `leak-${Date.now()}@test.local`, password: secret },
    });

    expect(validation.status).toBe(422);
    expect(JSON.stringify(validation.body)).not.toContain(secret);
    expect(validation.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(validation.body.error.details.fields)).toBe(true);

    const invalidId = await api('/products/not-a-uuid');
    expect(invalidId.status).toBe(422);
    expect(JSON.stringify(invalidId.body)).not.toContain('Failed query');
    expect(JSON.stringify(invalidId.body)).not.toContain('select "products"');
  });

  test('security headers and request IDs are present', async () => {
    const result = await api('/products');
    expect(result.status).toBe(200);
    expect(result.headers.get('x-content-type-options')).toBe('nosniff');
    expect(result.headers.get('x-frame-options')).toBe('DENY');
    expect(result.headers.get('content-security-policy')).toBeTruthy();
    expect(result.headers.get('x-request-id')).toBeTruthy();
  });

  test('health and swagger remain available', async () => {
    const health = await api('/health');
    expect(health.status).toBe(200);
    expect(health.body.database).toBe('connected');

    const swagger = await api('/swagger');
    expect([200, 301, 302]).toContain(swagger.status);
  });
});

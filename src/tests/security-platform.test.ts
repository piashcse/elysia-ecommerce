import { describe, expect, test } from 'bun:test';
import { totpCode } from '../utils/totp';
import {
  address,
  api,
  createAdmin,
  createCategory,
  createCustomer,
  createProduct,
  createSeller,
} from './helpers';

describe('Security and platform', () => {
  test('TOTP two-factor setup and login flow', async () => {
    const customer = await createCustomer();
    const setup = await api('/auth/2fa/setup', { method: 'POST', token: customer.token });
    expect(setup.status).toBe(200);
    const secret = setup.body.data.secret;

    const enable = await api('/auth/2fa/enable', {
      method: 'POST',
      token: customer.token,
      body: { code: totpCode(secret) },
    });
    expect(enable.status).toBe(200);

    const noCode = await api('/auth/login', {
      method: 'POST',
      body: { email: customer.user.email, password: customer.user.password },
    });
    expect(noCode.status).toBe(403);
    expect(noCode.body.error.code).toBe('TWO_FACTOR_REQUIRED');

    const withCode = await api('/auth/login', {
      method: 'POST',
      body: { email: customer.user.email, password: customer.user.password, twoFactorCode: totpCode(secret) },
    });
    expect(withCode.status).toBe(200);
    expect(withCode.body.data.token).toBeTruthy();
  });

  test('API keys authenticate requests and can be revoked', async () => {
    const customer = await createCustomer();
    const created = await api('/api-keys', {
      method: 'POST',
      token: customer.token,
      body: { name: 'Integration' },
    });
    expect(created.status).toBe(201);
    const key = created.body.data.key;

    const profile = await api('/users/profile', { headers: { 'X-API-Key': key } });
    expect(profile.status).toBe(200);
    expect(profile.body.data.email).toBe(customer.user.email);

    await api(`/api-keys/${created.body.data.id}`, { method: 'DELETE', token: customer.token });
    const revoked = await api('/users/profile', { headers: { 'X-API-Key': key } });
    expect(revoked.status).toBe(401);
  });

  test('GDPR export and account deletion anonymize the user', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const customer = await createCustomer();
    const category = await createCategory(admin.token);
    const product = await createProduct(admin.token, seller.user.id, category.id);
    await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });

    const exported = await api('/users/me/export', { token: customer.token });
    expect(exported.status).toBe(200);
    expect(exported.body.data.profile.email).toBe(customer.user.email);
    expect(exported.body.data.orders.length).toBeGreaterThanOrEqual(1);

    const deleted = await api('/users/me', { method: 'DELETE', token: customer.token });
    expect(deleted.status).toBe(200);

    const oldToken = await api('/users/profile', { token: customer.token });
    expect(oldToken.status).toBe(401);

    const login = await api('/auth/login', {
      method: 'POST',
      body: { email: customer.user.email, password: customer.user.password },
    });
    expect(login.status).toBe(401);

    const users = await api('/users?limit=100', { token: admin.token });
    expect(users.body.data.items.some((user: any) => user.id === customer.user.id)).toBe(false);
  });

  test('metrics endpoint exposes process and catalog metrics', async () => {
    const metrics = await api('/metrics');
    expect(metrics.status).toBe(200);
    expect(String(metrics.body)).toContain('elysia_uptime_seconds');
    expect(String(metrics.body)).toContain('elysia_products_total');
  });
});

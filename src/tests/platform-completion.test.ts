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

const setup = async () => {
  const admin = await createAdmin();
  const seller = await createSeller();
  const customer = await createCustomer();
  const category = await createCategory(admin.token);
  return { admin, seller, customer, category };
};

const createStackableCoupon = async (
  adminToken: string,
  suffix: string,
  body: Record<string, unknown>
) => {
  const result = await api('/coupons', {
    method: 'POST',
    token: adminToken,
    body: {
      code: `C-${suffix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2028-01-01T00:00:00.000Z',
      stackable: true,
      perUserLimit: 5,
      ...body,
    },
  });
  if (result.status !== 201) throw new Error(`Coupon creation failed: ${JSON.stringify(result.body)}`);
  return result.body.data;
};

describe('Platform completion', () => {
  test('stackable coupons combine while exclusive coupons are rejected', async () => {
    const { admin, seller, customer, category } = await setup();
    const product = await createProduct(admin.token, seller.user.id, category.id, { price: 10, stockQuantity: 20 });
    const suffix = Date.now().toString();

    const percent = await createStackableCoupon(admin.token, suffix, {
      discountType: 'percentage',
      discountValue: 10,
    });
    const fixed = await createStackableCoupon(admin.token, suffix, {
      discountType: 'fixed',
      discountValue: 2,
    });

    const stacked = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddress: address,
        couponCodes: [percent.code, fixed.code],
      },
    });
    expect(stacked.status).toBe(201);
    expect(Number(stacked.body.data.discountAmount)).toBe(3);
    expect(stacked.body.data.couponCodes.sort()).toEqual([percent.code, fixed.code].sort());

    const exclusive = await createStackableCoupon(admin.token, `X-${suffix}`, {
      discountType: 'fixed',
      discountValue: 1,
      stackable: false,
    });
    const rejected = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddress: address,
        couponCodes: [percent.code, exclusive.code],
      },
    });
    expect(rejected.status).toBe(422);
    expect(rejected.body.error.code).toBe('COUPON_NOT_STACKABLE');
  });

  test('coupons can discount shipping when appliesToShipping is enabled', async () => {
    const { admin, seller, customer, category } = await setup();
    const product = await createProduct(admin.token, seller.user.id, category.id, { price: 10, stockQuantity: 10 });
    const shipping = await api('/shipping-methods', {
      method: 'POST',
      token: admin.token,
      body: {
        name: `Shipping ${Date.now()}`,
        baseCost: 5,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });
    expect(shipping.status).toBe(201);

    const coupon = await createStackableCoupon(admin.token, `SHIP-${Date.now()}`, {
      discountType: 'percentage',
      discountValue: 10,
      appliesToShipping: true,
    });

    const quote = await api('/checkout/quote', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 1 }],
        shippingMethodId: shipping.body.data.id,
        couponCode: coupon.code,
      },
    });
    expect(quote.status).toBe(200);
    expect(Number(quote.body.data.discount)).toBe(1.5);
    expect(Number(quote.body.data.total)).toBe(13.5);
  });

  test('email preferences suppress transactional emails and outbox retries are tracked', async () => {
    const { admin, seller, customer, category } = await setup();
    const product = await createProduct(admin.token, seller.user.id, category.id, { price: 10, stockQuantity: 10 });

    const pref = await api('/notifications/preferences', {
      method: 'PUT',
      token: customer.token,
      body: { preferences: [{ type: 'order_confirmation', emailEnabled: false }] },
    });
    expect(pref.status).toBe(200);

    const muted = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });
    expect(muted.status).toBe(201);

    const outbox = await api('/emails?limit=100', { token: admin.token });
    expect(outbox.status).toBe(200);
    expect(outbox.body.data.some((email: any) => email.to === customer.user.email)).toBe(false);

    const other = await createCustomer();
    const order = await api('/orders', {
      method: 'POST',
      token: other.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });
    expect(order.status).toBe(201);

    const processed = await api('/emails/process', { method: 'POST', token: admin.token });
    expect(processed.status).toBe(200);

    const after = await api('/emails?limit=100', { token: admin.token });
    const record = after.body.data.find((email: any) => email.to === other.user.email);
    expect(record).toBeDefined();
    expect(record.status).toBe('sent');
    expect(record.attempts).toBe(1);
    expect(record.nextAttemptAt).toBeTruthy();
  });

  test('API key scopes restrict read/write and resource access', async () => {
    const { admin } = await setup();

    const readOnly = await api('/api-keys', {
      method: 'POST',
      token: admin.token,
      body: { name: 'Read only', scopes: ['read'] },
    });
    expect(readOnly.status).toBe(201);

    const list = await api('/users?limit=5', { headers: { 'X-API-Key': readOnly.body.data.key } });
    expect(list.status).toBe(200);

    const write = await api('/products', {
      method: 'POST',
      headers: { 'X-API-Key': readOnly.body.data.key },
      body: { name: 'Nope', price: 1, stockQuantity: 1, sku: `NOPE-${Date.now()}`, sellerId: admin.user.id },
    });
    expect(write.status).toBe(403);
    expect(write.body.error.code).toBe('API_KEY_SCOPE_DENIED');

    const productOnly = await api('/api-keys', {
      method: 'POST',
      token: admin.token,
      body: { name: 'Products only', scopes: ['read:products'] },
    });
    const allowed = await api('/products?limit=5', { headers: { 'X-API-Key': productOnly.body.data.key } });
    expect(allowed.status).toBe(200);

    const denied = await api('/users?limit=5', { headers: { 'X-API-Key': productOnly.body.data.key } });
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('API_KEY_SCOPE_DENIED');
  });

  test('2FA recovery codes can be used once and regenerated', async () => {
    const customer = await createCustomer();
    const setupResult = await api('/auth/2fa/setup', { method: 'POST', token: customer.token });
    expect(setupResult.status).toBe(200);
    const secret = setupResult.body.data.secret;

    const enabled = await api('/auth/2fa/enable', {
      method: 'POST',
      token: customer.token,
      body: { code: totpCode(secret) },
    });
    expect(enabled.status).toBe(200);
    expect(enabled.body.data.recoveryCodes.length).toBe(10);

    const recoveryCode = enabled.body.data.recoveryCodes[0];
    const login = await api('/auth/login', {
      method: 'POST',
      body: { email: customer.user.email, password: customer.user.password, twoFactorCode: recoveryCode },
    });
    expect(login.status).toBe(200);

    const reused = await api('/auth/login', {
      method: 'POST',
      body: { email: customer.user.email, password: customer.user.password, twoFactorCode: recoveryCode },
    });
    expect(reused.status).toBe(401);

    const regenerated = await api('/auth/2fa/recovery-codes', {
      method: 'POST',
      token: login.body.data.token,
      body: { password: customer.user.password },
    });
    expect(regenerated.status).toBe(200);
    expect(regenerated.body.data.recoveryCodes.length).toBe(10);

    const oldCode = await api('/auth/login', {
      method: 'POST',
      body: {
        email: customer.user.email,
        password: customer.user.password,
        twoFactorCode: enabled.body.data.recoveryCodes[1],
      },
    });
    expect(oldCode.status).toBe(401);
  });

  test('full-text search supports synonyms and typo tolerance', async () => {
    const { admin, seller, category } = await setup();
    const suffix = Date.now();
    const headphones = await createProduct(admin.token, seller.user.id, category.id, {
      name: `Wireless Headphones ${suffix}`,
      sku: `HEAD-${suffix}`,
    });
    const keyboard = await createProduct(admin.token, seller.user.id, category.id, {
      name: `Ergonomic Keyboard ${suffix}`,
      sku: `KEY-${suffix}`,
    });

    const synonym = await api('/admin/search/synonyms', {
      method: 'POST',
      token: admin.token,
      body: { term: 'cans', synonyms: ['headphones'] },
    });
    expect(synonym.status).toBe(201);

    const synonymSearch = await api('/products?search=cans&limit=50');
    expect(synonymSearch.body.data.items.some((item: any) => item.id === headphones.id)).toBe(true);

    const typoSearch = await api('/products?search=keybord&limit=50');
    expect(typoSearch.body.data.items.some((item: any) => item.id === keyboard.id)).toBe(true);
  });

  test('orders and quotes support multi-currency conversion', async () => {
    const { admin, seller, customer, category } = await setup();
    const product = await createProduct(admin.token, seller.user.id, category.id, { price: 10, stockQuantity: 10 });

    const currency = await api('/currencies', {
      method: 'POST',
      token: admin.token,
      body: { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.9 },
    });
    expect(currency.status).toBe(201);

    const conversion = await api('/currencies/convert?amount=10&from=USD&to=EUR');
    expect(conversion.status).toBe(200);
    expect(Number(conversion.body.data.convertedAmount)).toBe(9);

    const displayed = await api(`/products/${product.id}?currency=EUR`);
    expect(displayed.status).toBe(200);
    expect(Number(displayed.body.data.price)).toBe(9);
    expect(displayed.body.data.currency).toBe('EUR');

    const quote = await api('/checkout/quote', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], currency: 'EUR' },
    });
    expect(quote.status).toBe(200);
    expect(quote.body.data.currency).toBe('EUR');
    expect(Number(quote.body.data.total)).toBe(9);

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddress: address,
        currency: 'EUR',
      },
    });
    expect(order.status).toBe(201);
    expect(order.body.data.currency).toBe('EUR');
    expect(Number(order.body.data.totalAmount)).toBe(9);
    expect(Number(order.body.data.exchangeRate)).toBe(0.9);
  });

  test('product and category translations localize catalog responses', async () => {
    const { admin, seller, category } = await setup();
    const suffix = Date.now();
    const product = await createProduct(admin.token, seller.user.id, category.id, {
      name: `Translate Me ${suffix}`,
      slug: `translate-${suffix}`,
    });

    const translatedProduct = await api(`/products/${product.id}/translations/es`, {
      method: 'PUT',
      token: seller.token,
      body: { name: 'Auriculares Inalámbricos', description: 'Sonido increíble' },
    });
    expect(translatedProduct.status).toBe(200);

    const bySlug = await api(`/products/slug/translate-${suffix}?locale=es`);
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.data.name).toBe('Auriculares Inalámbricos');

    const listed = await api(`/products?locale=es&search=${encodeURIComponent(`Translate Me ${suffix}`)}`);
    const localized = listed.body.data.items.find((item: any) => item.id === product.id);
    expect(localized.name).toBe('Auriculares Inalámbricos');

    const translatedCategory = await api(`/categories/${category.id}/translations/es`, {
      method: 'PUT',
      token: admin.token,
      body: { name: 'Categoría Traducida' },
    });
    expect(translatedCategory.status).toBe(200);

    const categoryBySlug = await api(`/categories/${category.id}?locale=es`);
    expect(categoryBySlug.body.data.name).toBe('Categoría Traducida');

    const tree = await api('/categories/tree?locale=es');
    const translatedNode = JSON.stringify(tree.body.data).includes('Categoría Traducida');
    expect(translatedNode).toBe(true);
  });
});

import { describe, expect, test } from 'bun:test';
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
  const product = await createProduct(admin.token, seller.user.id, category.id, { price: 10, stockQuantity: 10 });
  return { admin, seller, customer, category, product };
};

describe('Marketplace and admin features', () => {
  test('coupon scopes restrict discounts to selected products', async () => {
    const { admin, seller, customer, category, product } = await setup();
    const other = await createProduct(admin.token, seller.user.id, category.id, { price: 10, stockQuantity: 10 });
    const code = `SCOPE-${Date.now()}`;

    const coupon = await api('/coupons', {
      method: 'POST',
      token: admin.token,
      body: {
        code,
        discountType: 'fixed',
        discountValue: 2,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2028-01-01T00:00:00.000Z',
        perUserLimit: 5,
      },
    });
    expect(coupon.status).toBe(201);

    const scoped = await api(`/coupons/${coupon.body.data.id}/scopes`, {
      method: 'PUT',
      token: admin.token,
      body: { productIds: [product.id] },
    });
    expect(scoped.status).toBe(200);

    const valid = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address, couponCode: code },
    });
    expect(valid.status).toBe(201);
    expect(Number(valid.body.data.discountAmount)).toBe(2);

    const invalid = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: other.id, quantity: 1 }], shippingAddress: address, couponCode: code },
    });
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('COUPON_NOT_APPLICABLE');
  });

  test('gift cards reduce the order total and track the remaining balance', async () => {
    const { admin, customer, product } = await setup();
    const card = await api('/gift-cards', {
      method: 'POST',
      token: admin.token,
      body: { balance: 25 },
    });
    expect(card.status).toBe(201);
    const code = card.body.data.code;

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address, giftCardCode: code },
    });
    expect(order.status).toBe(201);
    expect(Number(order.body.data.giftCardAmount)).toBe(10);
    expect(Number(order.body.data.totalAmount)).toBe(0);

    const balance = await api(`/gift-cards/${code}`, { token: customer.token });
    expect(balance.body.data.balance).toBe('15.00');
  });

  test('sellers can fulfill items and view payout summaries', async () => {
    const { admin, seller, customer, product } = await setup();
    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });
    expect(order.status).toBe(201);

    const fulfillment = await api(`/seller/orders/${order.body.data.id}/items/${order.body.data.items[0].id}`, {
      method: 'PUT',
      token: seller.token,
      body: { status: 'shipped' },
    });
    expect(fulfillment.status).toBe(200);
    expect(fulfillment.body.data.fulfillmentStatus).toBe('shipped');

    const payout = await api('/payouts', {
      method: 'POST',
      token: admin.token,
      body: { sellerId: seller.user.id, amount: 5 },
    });
    expect(payout.status).toBe(201);

    const summary = await api('/seller/payouts', { token: seller.token });
    expect(summary.status).toBe(200);
    expect(summary.body.data.payouts.length).toBeGreaterThanOrEqual(1);
  });

  test('admin reports and audit logs are available', async () => {
    const { admin, seller } = await setup();
    await api('/payouts', {
      method: 'POST',
      token: admin.token,
      body: { sellerId: seller.user.id, amount: 1 },
    });

    const report = await api('/admin/reports/sales', { token: admin.token });
    expect(report.status).toBe(200);
    expect(report.body.data.summary).toBeDefined();

    await Bun.sleep(50);
    const audit = await api('/admin/audit-logs', { token: admin.token });
    expect(audit.status).toBe(200);
    expect(audit.body.data.items.some((item: any) => item.path === '/payouts')).toBe(true);
  });
});

import { describe, expect, test } from 'bun:test';
import { createHmac } from 'crypto';
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
  const product = await createProduct(admin.token, seller.user.id, category.id, { price: 10, stockQuantity: 5 });
  return { admin, seller, customer, category, product };
};

const sign = (body: unknown) =>
  createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev-webhook-secret')
    .update(JSON.stringify(body))
    .digest('hex');

describe('Payments and messaging', () => {
  test('saved tokenized payment methods can pay without raw card data', async () => {
    const { customer, product } = await setup();
    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });
    expect(order.status).toBe(201);

    const saved = await api('/payment-methods', {
      method: 'POST',
      token: customer.token,
      body: { provider: 'simulated', token: 'tok_test_123', brand: 'visa', last4: '4242', isDefault: true },
    });
    expect(saved.status).toBe(201);

    const methods = await api('/payment-methods', { token: customer.token });
    expect(methods.status).toBe(200);
    expect(methods.body.data.length).toBe(1);

    const paid = await api('/payments/process', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId: order.body.data.id,
        method: 'credit_card',
        amount: Number(order.body.data.totalAmount),
        paymentDetails: {},
        paymentMethodId: saved.body.data.id,
      },
    });
    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe('completed');
  });

  test('signed payment webhooks are idempotent and update the order', async () => {
    const { customer, product } = await setup();
    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });
    const created = await api('/payments', {
      method: 'POST',
      token: customer.token,
      body: { orderId: order.body.data.id, method: 'paypal', amount: Number(order.body.data.totalAmount) },
    });
    expect(created.status).toBe(201);

    const event = {
      id: `evt_${Date.now()}`,
      type: 'payment.completed',
      data: { orderId: order.body.data.id, paymentId: created.body.data.id, transactionId: 'txn_webhook' },
    };

    const invalid = await api('/payments/webhook', {
      method: 'POST',
      headers: { 'X-Payment-Signature': 'bad' },
      body: event,
    });
    expect(invalid.status).toBe(403);

    const first = await api('/payments/webhook', {
      method: 'POST',
      headers: { 'X-Payment-Signature': sign(event) },
      body: event,
    });
    expect(first.status).toBe(200);

    const second = await api('/payments/webhook', {
      method: 'POST',
      headers: { 'X-Payment-Signature': sign(event) },
      body: event,
    });
    expect(second.status).toBe(200);

    const orderAfter = await api(`/orders/${order.body.data.id}`, { token: customer.token });
    expect(orderAfter.body.data.status).toBe('processing');
  });

  test('order emails are queued and processed through the outbox', async () => {
    const { admin, customer, product } = await setup();
    await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });

    const outbox = await api('/emails?limit=100', { token: admin.token });
    expect(outbox.status).toBe(200);
    expect(outbox.body.data.some((email: any) => email.to === customer.user.email)).toBe(true);

    const processed = await api('/emails/process', { method: 'POST', token: admin.token, body: { limit: 100 } });
    expect(processed.status).toBe(200);

    const after = await api('/emails?limit=100', { token: admin.token });
    expect(after.body.data.some((email: any) => email.to === customer.user.email && email.status === 'sent')).toBe(true);
  });

  test('notification preferences suppress in-app notifications', async () => {
    const { customer, product } = await setup();
    const prefs = await api('/notifications/preferences', {
      method: 'PUT',
      token: customer.token,
      body: { preferences: [{ type: 'order_confirmation', inAppEnabled: false }] },
    });
    expect(prefs.status).toBe(200);

    await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });

    const notifications = await api('/notifications?limit=20', { token: customer.token });
    expect(notifications.body.data.items.some((item: any) => item.type === 'order_confirmation')).toBe(false);
  });
});

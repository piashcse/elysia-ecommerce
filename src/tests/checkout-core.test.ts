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

describe('Checkout core: variants, guests, quotes, idempotency', () => {
  test('guest cart, merge, variant pricing, guest order, payment, and events', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const customer = await createCustomer();
    const category = await createCategory(admin.token);
    const product = await createProduct(admin.token, seller.user.id, category.id, {
      price: 10,
      stockQuantity: 10,
    });

    const variant = await api(`/products/${product.id}/variants`, {
      method: 'POST',
      token: seller.token,
      body: {
        sku: `GUEST-${Date.now()}`,
        name: 'Large',
        price: 12,
        stockQuantity: 2,
      },
    });
    expect(variant.status).toBe(200);
    const variantId = variant.body.data.id;
    const sessionId = crypto.randomUUID();

    const guestCart = await api('/cart/items', {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId },
      body: { productId: product.id, variantId, quantity: 1 },
    });
    expect(guestCart.status).toBe(200);
    expect(guestCart.headers.get('x-session-id')).toBe(sessionId);
    expect(guestCart.body.data.items[0].variantId).toBe(variantId);
    expect(guestCart.body.data.items[0].variant.price).toBe('12.00');

    const merge = await api('/cart/merge', {
      method: 'POST',
      token: customer.token,
      headers: { 'X-Session-Id': sessionId },
    });
    expect(merge.status).toBe(200);
    expect(merge.body.data.items.length).toBe(1);

    const quote = await api('/checkout/quote', {
      method: 'POST',
      body: {
        email: 'guest@example.com',
        items: [{ productId: product.id, variantId, quantity: 1 }],
      },
    });
    expect(quote.status).toBe(200);
    expect(Number(quote.body.data.subtotal)).toBe(12);
    expect(Number(quote.body.data.total)).toBe(12);

    const idempotencyKey = crypto.randomUUID();
    const orderBody = {
      email: 'guest@example.com',
      items: [{ productId: product.id, variantId, quantity: 1 }],
      shippingAddress: address,
    };

    const firstOrder = await api('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: orderBody,
    });
    expect(firstOrder.status).toBe(201);
    expect(firstOrder.body.data.orderNumber).toMatch(/^ORD-/);
    expect(firstOrder.body.data.guestToken).toBeTruthy();
    const orderId = firstOrder.body.data.id;
    const guestToken = firstOrder.body.data.guestToken;

    const secondOrder = await api('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: orderBody,
    });
    expect(secondOrder.status).toBe(201);
    expect(secondOrder.body.data.id).toBe(orderId);

    const guestView = await api(`/orders/${orderId}?guestToken=${guestToken}`);
    expect(guestView.status).toBe(200);
    expect(guestView.body.data.items[0].variantId).toBe(variantId);

    const events = await api(`/orders/${orderId}/events?guestToken=${guestToken}`);
    expect(events.status).toBe(200);
    expect(events.body.data.some((event: any) => event.type === 'created')).toBe(true);

    const payment = await api('/payments/process', {
      method: 'POST',
      body: {
        orderId,
        method: 'cash_on_delivery',
        amount: Number(firstOrder.body.data.totalAmount),
        paymentDetails: {},
        guestToken,
      },
    });
    expect(payment.status).toBe(200);
    expect(payment.body.data.status).toBe('pending');

    const variants = await api(`/products/${product.id}/variants`);
    expect(variants.body.data[0].stockQuantity).toBe(1);
  });

  test('order ownership still blocks other users and guest tokens are required', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const customer = await createCustomer();
    const other = await createCustomer();
    const category = await createCategory(admin.token);
    const product = await createProduct(admin.token, seller.user.id, category.id);

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });
    expect(order.status).toBe(201);

    const otherView = await api(`/orders/${order.body.data.id}`, { token: other.token });
    expect(otherView.status).toBe(403);

    const noGuestToken = await api(`/orders/${order.body.data.id}?guestToken=wrong`);
    expect(noGuestToken.status).toBe(403);
  });
});

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
  const product = await createProduct(admin.token, seller.user.id, category.id, {
    price: 10,
    stockQuantity: 5,
  });
  return { admin, seller, customer, category, product };
};

describe('Post-purchase: tax, shipping rules, returns, and invoices', () => {
  test('regional tax rates are applied and shown on the invoice', async () => {
    const { admin, customer, product } = await setup();
    const country = `Taxland-${Date.now()}`;

    const tax = await api('/tax-rates', {
      method: 'POST',
      token: admin.token,
      body: { name: 'Regional VAT', country, rate: 0.1 },
    });
    expect(tax.status).toBe(201);

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddress: { ...address, country },
      },
    });
    expect(order.status).toBe(201);
    expect(Number(order.body.data.taxRate)).toBe(0.1);
    expect(Number(order.body.data.taxAmount)).toBe(1);

    const invoice = await api(`/orders/${order.body.data.id}/invoice`, { token: customer.token });
    expect(invoice.status).toBe(200);
    expect(String(invoice.body)).toContain('Invoice');
    expect(String(invoice.body)).toContain(order.body.data.orderNumber);
  });

  test('shipping countries and free-shipping thresholds are respected', async () => {
    const { admin, product } = await setup();
    const country = `Shipland-${Date.now()}`;

    const method = await api('/shipping-methods', {
      method: 'POST',
      token: admin.token,
      body: {
        name: `Regional ${country}`,
        baseCost: 9,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
        countries: [country],
        freeShippingThreshold: 10,
      },
    });
    expect(method.status).toBe(201);

    const quote = await api('/shipping-methods/quote', {
      method: 'POST',
      body: { items: [{ productId: product.id, quantity: 1 }], country },
    });
    expect(quote.status).toBe(200);
    const option = quote.body.data.options.find((item: any) => item.id === method.body.data.id);
    expect(option.shippingCost).toBe('0.00');

    const outside = await api('/shipping-methods/quote', {
      method: 'POST',
      body: { items: [{ productId: product.id, quantity: 1 }], country: 'Otherland' },
    });
    expect(outside.body.data.options.some((item: any) => item.id === method.body.data.id)).toBe(false);
  });

  test('returns restore stock and refund the payment', async () => {
    const { admin, customer, product } = await setup();
    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: product.id, quantity: 1 }], shippingAddress: address },
    });
    expect(order.status).toBe(201);

    const payment = await api('/payments/process', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId: order.body.data.id,
        method: 'paypal',
        amount: Number(order.body.data.totalAmount),
        paymentDetails: { paypalEmail: 'returns@example.com' },
      },
    });
    expect(payment.status).toBe(200);

    const created = await api('/returns', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId: order.body.data.id,
        reason: 'Not as described',
        items: [{ orderItemId: order.body.data.items[0].id, quantity: 1 }],
      },
    });
    expect(created.status).toBe(201);
    const returnId = created.body.data.id;

    const approve = await api(`/returns/${returnId}/approve`, { method: 'POST', token: admin.token });
    expect(approve.status).toBe(200);

    const receive = await api(`/returns/${returnId}/receive`, { method: 'POST', token: admin.token });
    expect(receive.status).toBe(200);

    const productAfter = await api(`/products/${product.id}`);
    expect(productAfter.body.data.stockQuantity).toBe(5);

    const refund = await api(`/returns/${returnId}/refund`, { method: 'POST', token: admin.token });
    expect(refund.status).toBe(200);
    expect(refund.body.data.status).toBe('refunded');

    const orderAfter = await api(`/orders/${order.body.data.id}`, { token: customer.token });
    expect(orderAfter.body.data.status).toBe('refunded');
  });
});

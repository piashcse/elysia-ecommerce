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
    weightGrams: 1000,
  });

  const shipping = await api('/shipping-methods', {
    method: 'POST',
    token: admin.token,
    body: {
      name: `Shipping ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      baseCost: 5,
      costPerKg: 2,
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
    },
  });

  return {
    admin,
    seller,
    customer,
    category,
    product,
    shippingMethod: shipping.body.data,
  };
};

const placeOrder = async (
  token: string,
  productId: string,
  quantity: number,
  extra: Record<string, unknown> = {}
) => {
  const result = await api('/orders', {
    method: 'POST',
    token,
    body: {
      items: [{ productId, quantity }],
      shippingAddress: address,
      ...extra,
    },
  });
  return result;
};

describe('Orders, inventory, coupons, and payments', () => {
  test('duplicate order lines are merged and stock is decremented exactly once', async () => {
    const { customer, product, shippingMethod } = await setup();

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [
          { productId: product.id, quantity: 2 },
          { productId: product.id, quantity: 2 },
        ],
        shippingAddress: address,
        shippingMethodId: shippingMethod.id,
      },
    });

    expect(order.status).toBe(201);
    expect(order.body.data.items.length).toBe(1);
    expect(order.body.data.items[0].quantity).toBe(4);
    expect(order.body.data.shippingMethodId).toBe(shippingMethod.id);
    expect(Number(order.body.data.subtotal)).toBe(40);
    expect(Number(order.body.data.shippingCost)).toBe(13); // 5 base + 4kg * 2

    const productAfter = await api(`/products/${product.id}`);
    expect(productAfter.body.data.stockQuantity).toBe(1);
  });

  test('cancelling an order restores stock', async () => {
    const { customer, product } = await setup();
    const order = await placeOrder(customer.token, product.id, 2);
    expect(order.status).toBe(201);

    const cancel = await api(`/orders/${order.body.data.id}/cancel`, {
      method: 'PUT',
      token: customer.token,
    });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('cancelled');

    const productAfter = await api(`/products/${product.id}`);
    expect(productAfter.body.data.stockQuantity).toBe(5);
  });

  test('coupons apply a discount and enforce per-user limits', async () => {
    const { admin, customer, product } = await setup();
    const code = `SAVE10-${Date.now()}`;

    const coupon = await api('/coupons', {
      method: 'POST',
      token: admin.token,
      body: {
        code,
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 10,
        maxDiscountAmount: 5,
        perUserLimit: 1,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2028-01-01T00:00:00.000Z',
      },
    });
    expect(coupon.status).toBe(201);

    const validation = await api('/coupons/validate', {
      method: 'POST',
      token: customer.token,
      body: { code, orderAmount: 40 },
    });
    expect(validation.status).toBe(200);
    expect(Number(validation.body.data.discountAmount)).toBe(4);

    const order = await placeOrder(customer.token, product.id, 2, { couponCode: code });
    expect(order.status).toBe(201);
    expect(order.body.data.couponCode).toBe(code.toUpperCase());
    expect(Number(order.body.data.discountAmount)).toBe(2);

    const secondUse = await placeOrder(customer.token, product.id, 1, { couponCode: code });
    expect(secondUse.status).toBe(422);
    expect(secondUse.body.error.code).toBe('COUPON_USER_LIMIT');
  });

  test('cancelling an order releases its coupon usage', async () => {
    const { admin, customer, product } = await setup();
    const code = `REUSE-${Date.now()}`;

    await api('/coupons', {
      method: 'POST',
      token: admin.token,
      body: {
        code,
        discountType: 'fixed',
        discountValue: 1,
        perUserLimit: 1,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2028-01-01T00:00:00.000Z',
      },
    });

    const first = await placeOrder(customer.token, product.id, 1, { couponCode: code });
    expect(first.status).toBe(201);

    await api(`/orders/${first.body.data.id}/cancel`, {
      method: 'PUT',
      token: customer.token,
    });

    const second = await placeOrder(customer.token, product.id, 1, { couponCode: code });
    expect(second.status).toBe(201);
    expect(Number(second.body.data.discountAmount)).toBe(1);
  });

  test('invalid coupons and invalid order transitions are rejected', async () => {
    const { admin, customer, product } = await setup();

    const invalidCoupon = await api('/coupons', {
      method: 'POST',
      token: admin.token,
      body: {
        code: `BAD-${Date.now()}`,
        discountType: 'percentage',
        discountValue: 150,
        startDate: '2028-01-01T00:00:00.000Z',
        endDate: '2027-01-01T00:00:00.000Z',
      },
    });
    expect(invalidCoupon.status).toBe(422);

    const order = await placeOrder(customer.token, product.id, 1);
    const invalidTransition = await api(`/orders/${order.body.data.id}`, {
      method: 'PUT',
      token: admin.token,
      body: { status: 'delivered' },
    });
    expect(invalidTransition.status).toBe(409);
    expect(invalidTransition.body.error.code).toBe('INVALID_ORDER_TRANSITION');
  });

  test('payments enforce ownership, amount, idempotency, and refund rules', async () => {
    const { admin, customer, product } = await setup();
    const other = await createCustomer();
    const order = await placeOrder(customer.token, product.id, 1);
    const orderId = order.body.data.id;
    const total = Number(order.body.data.totalAmount);

    const wrongAmount = await api('/payments', {
      method: 'POST',
      token: customer.token,
      body: { orderId, method: 'paypal', amount: total - 1 },
    });
    expect(wrongAmount.status).toBe(422);
    expect(wrongAmount.body.error.code).toBe('PAYMENT_AMOUNT_MISMATCH');

    const theft = await api('/payments/process', {
      method: 'POST',
      token: other.token,
      body: {
        orderId,
        method: 'paypal',
        amount: total,
        paymentDetails: { paypalEmail: 'other@example.com' },
      },
    });
    expect(theft.status).toBe(403);

    const paid = await api('/payments/process', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId,
        method: 'paypal',
        amount: total,
        paymentDetails: { paypalEmail: 'customer@example.com' },
      },
    });
    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe('completed');

    const paidAgain = await api('/payments/process', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId,
        method: 'paypal',
        amount: total,
        paymentDetails: { paypalEmail: 'customer@example.com' },
      },
    });
    expect(paidAgain.status).toBe(409);
    expect(paidAgain.body.error.code).toBe('ORDER_ALREADY_PAID');

    const orderAfterPayment = await api(`/orders/${orderId}`, { token: customer.token });
    expect(orderAfterPayment.body.data.status).toBe('processing');

    const refund = await api(`/payments/${paid.body.data.id}/refund`, {
      method: 'POST',
      token: admin.token,
    });
    expect(refund.status).toBe(200);
    expect(refund.body.data.status).toBe('refunded');

    const orderAfterRefund = await api(`/orders/${orderId}`, { token: customer.token });
    expect(orderAfterRefund.body.data.status).toBe('refunded');

    const productAfterRefund = await api(`/products/${product.id}`);
    expect(productAfterRefund.body.data.stockQuantity).toBe(5);
  });

  test('cancelled orders cannot be paid and stats exclude refunded orders', async () => {
    const { admin, customer, product } = await setup();
    const order = await placeOrder(customer.token, product.id, 1);

    await api(`/orders/${order.body.data.id}/cancel`, {
      method: 'PUT',
      token: customer.token,
    });

    const payment = await api('/payments/process', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId: order.body.data.id,
        method: 'paypal',
        amount: Number(order.body.data.totalAmount),
        paymentDetails: { paypalEmail: 'customer@example.com' },
      },
    });
    expect(payment.status).toBe(409);
    expect(payment.body.error.code).toBe('ORDER_NOT_PAYABLE');

    const stats = await api('/orders/stats', { token: admin.token });
    expect(stats.status).toBe(200);
    expect(typeof stats.body.data.totalOrders).toBe('number');
    expect(typeof stats.body.data.totalRevenue).toBe('number');
  });
});

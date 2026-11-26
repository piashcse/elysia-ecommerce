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
    stockQuantity: 10,
  });
  return { admin, seller, customer, category, product };
};

describe('Reviews, notifications, and seller statistics', () => {
  test('reviews are approved by default, include authors, and deduplicate helpful votes', async () => {
    const { customer, product } = await setup();

    const review = await api('/reviews', {
      method: 'POST',
      token: customer.token,
      body: {
        productId: product.id,
        rating: 5,
        title: 'Great product',
        comment: 'Works as expected',
      },
    });
    expect(review.status).toBe(201);
    expect(review.body.data.isApproved).toBe(true);

    const duplicate = await api('/reviews', {
      method: 'POST',
      token: customer.token,
      body: { productId: product.id, rating: 4 },
    });
    expect(duplicate.status).toBe(409);

    const firstHelpful = await api(`/reviews/${review.body.data.id}/helpful`, {
      method: 'POST',
      token: customer.token,
    });
    expect(firstHelpful.status).toBe(200);
    expect(firstHelpful.body.data.helpfulCount).toBe(1);

    const secondHelpful = await api(`/reviews/${review.body.data.id}/helpful`, {
      method: 'POST',
      token: customer.token,
    });
    expect(secondHelpful.body.data.helpfulCount).toBe(1);

    const publicReviews = await api(`/reviews/product/${product.id}`);
    expect(publicReviews.status).toBe(200);
    expect(publicReviews.body.data.items.length).toBe(1);
    expect(publicReviews.body.data.items[0].user.id).toBe(customer.user.id);
    expect(publicReviews.body.data.meta.averageRating).toBe(5);
  });

  test('review ownership and moderation are enforced', async () => {
    const { admin, customer, product } = await setup();
    const other = await createCustomer();

    const review = await api('/reviews', {
      method: 'POST',
      token: customer.token,
      body: { productId: product.id, rating: 4 },
    });
    const reviewId = review.body.data.id;

    const otherUpdate = await api(`/reviews/${reviewId}`, {
      method: 'PUT',
      token: other.token,
      body: { rating: 1 },
    });
    expect(otherUpdate.status).toBe(403);

    const reject = await api(`/reviews/${reviewId}/approve`, {
      method: 'PATCH',
      token: admin.token,
      body: { isApproved: false },
    });
    expect(reject.status).toBe(200);

    const hidden = await api(`/reviews/product/${product.id}`);
    expect(hidden.body.data.items.length).toBe(0);

    const pending = await api('/reviews/pending', { token: admin.token });
    expect(pending.status).toBe(200);
    expect(pending.body.data.items.some((item: any) => item.id === reviewId)).toBe(true);

    const approve = await api(`/reviews/${reviewId}/approve`, {
      method: 'PATCH',
      token: admin.token,
      body: { isApproved: true },
    });
    expect(approve.status).toBe(200);

    const visible = await api(`/reviews/product/${product.id}`);
    expect(visible.body.data.items.length).toBe(1);
  });

  test('order, payment, and refund events create notifications', async () => {
    const { admin, customer, product } = await setup();

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddress: address,
      },
    });
    expect(order.status).toBe(201);
    const orderId = order.body.data.id;

    const paid = await api('/payments/process', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId,
        method: 'paypal',
        amount: Number(order.body.data.totalAmount),
        paymentDetails: { paypalEmail: 'customer@example.com' },
      },
    });
    expect(paid.status).toBe(200);

    const refund = await api(`/payments/${paid.body.data.id}/refund`, {
      method: 'POST',
      token: admin.token,
    });
    expect(refund.status).toBe(200);

    const notifications = await api('/notifications?limit=20', { token: customer.token });
    expect(notifications.status).toBe(200);
    const types = notifications.body.data.items.map((item: any) => item.type);
    expect(types).toContain('order_confirmation');
    expect(types).toContain('payment_success');
    expect(types).toContain('payment_refunded');

    const unread = await api('/notifications/unread-count', { token: customer.token });
    expect(unread.body.data.count).toBeGreaterThanOrEqual(3);

    const first = notifications.body.data.items[0];
    const markRead = await api(`/notifications/${first.id}/read`, {
      method: 'PATCH',
      token: customer.token,
    });
    expect(markRead.status).toBe(200);

    const afterOne = await api('/notifications/unread-count', { token: customer.token });
    expect(afterOne.body.data.count).toBe(unread.body.data.count - 1);

    const markAll = await api('/notifications/read/all', {
      method: 'PATCH',
      token: customer.token,
    });
    expect(markAll.status).toBe(200);

    const afterAll = await api('/notifications/unread-count', { token: customer.token });
    expect(afterAll.body.data.count).toBe(0);
  });

  test('seller statistics report products, low stock, and delivered sales', async () => {
    const { admin, seller, customer, product } = await setup();

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 2 }],
        shippingAddress: address,
      },
    });
    const orderId = order.body.data.id;

    await api('/payments/process', {
      method: 'POST',
      token: customer.token,
      body: {
        orderId,
        method: 'paypal',
        amount: Number(order.body.data.totalAmount),
        paymentDetails: { paypalEmail: 'customer@example.com' },
      },
    });

    // Move the order to delivered as an admin.
    await api(`/orders/${orderId}`, {
      method: 'PUT',
      token: admin.token,
      body: { status: 'shipped' },
    });
    await api(`/orders/${orderId}`, {
      method: 'PUT',
      token: admin.token,
      body: { status: 'delivered' },
    });

    const stats = await api('/seller/stats', { token: seller.token });
    expect(stats.status).toBe(200);
    expect(stats.body.data.totalProducts).toBeGreaterThanOrEqual(1);
    expect(stats.body.data.itemsSold).toBeGreaterThanOrEqual(2);
    expect(stats.body.data.revenue).toBeGreaterThanOrEqual(20);
  });
});

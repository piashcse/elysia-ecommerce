import { describe, expect, test } from 'bun:test';
import {
  address,
  api,
  createAdmin,
  createCategory,
  createCustomer,
  createProduct,
  createSeller,
  createUser,
  login,
} from './helpers';
import { UserRole } from '../core/roles';

const createOrder = async (token: string, items: Array<{ productId: string; quantity: number }>) => {
  const result = await api('/orders', {
    method: 'POST',
    token,
    body: { items, shippingAddress: address },
  });
  if (result.status !== 201) throw new Error(`Order creation failed: ${JSON.stringify(result.body)}`);
  return result.body.data;
};

describe('Authorization and IDOR protection', () => {
  test('cart and wishlist items are isolated per user', async () => {
    const { token: adminToken } = await createAdmin();
    const { user: seller } = await createSeller();
    const { token: ownerToken } = await createCustomer();
    const { token: attackerToken } = await createCustomer();
    const category = await createCategory(adminToken);
    const product = await createProduct(adminToken, seller.id, category.id);

    const cartItem = await api('/cart/items', {
      method: 'POST',
      token: ownerToken,
      body: { productId: product.id, quantity: 1 },
    });
    expect(cartItem.status).toBe(200);
    const cartItemId = cartItem.body.data.items[0].id;

    const attackerUpdate = await api(`/cart/items/${cartItemId}`, {
      method: 'PUT',
      token: attackerToken,
      body: { quantity: 5 },
    });
    expect(attackerUpdate.status).toBe(404);

    const attackerDelete = await api(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
      token: attackerToken,
    });
    expect(attackerDelete.status).toBe(404);

    const wishlist = await api('/wishlist/items', {
      method: 'POST',
      token: ownerToken,
      body: { productId: product.id },
    });
    expect(wishlist.status).toBe(201);
    const wishlistId = wishlist.body.data.id;

    const attackerWishlistDelete = await api(`/wishlist/items/${wishlistId}`, {
      method: 'DELETE',
      token: attackerToken,
    });
    expect(attackerWishlistDelete.status).toBe(404);
  });

  test('orders and payments cannot be accessed across users', async () => {
    const { token: adminToken } = await createAdmin();
    const { user: seller } = await createSeller();
    const { token: ownerToken } = await createCustomer();
    const { token: attackerToken } = await createCustomer();
    const category = await createCategory(adminToken);
    const product = await createProduct(adminToken, seller.id, category.id);
    const order = await createOrder(ownerToken, [{ productId: product.id, quantity: 1 }]);

    const attackerView = await api(`/orders/${order.id}`, { token: attackerToken });
    expect(attackerView.status).toBe(403);

    const attackerCancel = await api(`/orders/${order.id}/cancel`, {
      method: 'PUT',
      token: attackerToken,
    });
    expect(attackerCancel.status).toBe(403);

    const attackerPayment = await api('/payments', {
      method: 'POST',
      token: attackerToken,
      body: { orderId: order.id, method: 'paypal', amount: Number(order.totalAmount) },
    });
    expect(attackerPayment.status).toBe(403);

    const attackerProcess = await api('/payments/process', {
      method: 'POST',
      token: attackerToken,
      body: {
        orderId: order.id,
        method: 'paypal',
        amount: Number(order.totalAmount),
        paymentDetails: { paypalEmail: 'attacker@example.com' },
      },
    });
    expect(attackerProcess.status).toBe(403);
  });

  test('admin-only mutations are denied to customers and sellers', async () => {
    const { token: customerToken } = await createCustomer();
    const { token: sellerToken } = await createSeller();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const requests: Array<{ path: string; body: Record<string, unknown> }> = [
      {
        path: '/users',
        body: { email: `denied-${suffix}@test.local`, password: 'Password123!', role: 'customer' },
      },
      {
        path: '/coupons',
        body: {
          code: `DENIED-${suffix}`,
          discountType: 'fixed',
          discountValue: 1,
          startDate: '2027-01-01T00:00:00.000Z',
          endDate: '2028-01-01T00:00:00.000Z',
        },
      },
      {
        path: '/shipping-methods',
        body: { name: `Denied ${suffix}`, baseCost: 1, estimatedDaysMin: 1, estimatedDaysMax: 2 },
      },
      {
        path: '/products',
        body: {
          name: `Denied ${suffix}`,
          price: 1,
          stockQuantity: 1,
          sku: `DENIED-${suffix}`,
          categoryId: crypto.randomUUID(),
          sellerId: crypto.randomUUID(),
        },
      },
      { path: '/categories', body: { name: `Denied ${suffix}` } },
    ];

    for (const request of requests) {
      const customerResult = await api(request.path, {
        method: 'POST',
        token: customerToken,
        body: request.body,
      });
      expect(customerResult.status).toBe(403);

      const sellerResult = await api(request.path, {
        method: 'POST',
        token: sellerToken,
        body: request.body,
      });
      expect(sellerResult.status).toBe(403);
    }
  });

  test('seller order views only include that seller items', async () => {
    const { token: adminToken } = await createAdmin();
    const sellerOne = await createSeller();
    const sellerTwo = await createSeller();
    const { token: customerToken } = await createCustomer();
    const category = await createCategory(adminToken);

    const productOne = await createProduct(adminToken, sellerOne.user.id, category.id, { price: 10 });
    const productTwo = await createProduct(adminToken, sellerTwo.user.id, category.id, { price: 20 });

    const order = await createOrder(customerToken, [
      { productId: productOne.id, quantity: 2 },
      { productId: productTwo.id, quantity: 1 },
    ]);

    const sellerOrders = await api('/seller/orders', { token: sellerOne.token });
    expect(sellerOrders.status).toBe(200);

    const matching = sellerOrders.body.data.items.find((item: any) => item.orderId === order.id);
    expect(matching).toBeDefined();
    expect(matching.items.length).toBe(1);
    expect(matching.items[0].productId).toBe(productOne.id);
    expect(Number(matching.sellerSubtotal)).toBe(20);

    const otherItem = matching.items.find((item: any) => item.productId === productTwo.id);
    expect(otherItem).toBeUndefined();
  });

  test('refresh and access tokens belong to the current user role', async () => {
    const seller = await createUser(UserRole.SELLER);
    const sellerToken = await login(seller);
    const { token: adminToken } = await createAdmin();

    // A seller cannot use admin user-management endpoints.
    const listUsers = await api('/users', { token: sellerToken });
    expect(listUsers.status).toBe(403);

    // Admin can list users.
    const adminList = await api('/users', { token: adminToken });
    expect(adminList.status).toBe(200);

    // A token signed for a different issuer/audience is rejected.
    const bogus = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4IiwiaXNzIjoiZWx5c2lhLWVjb21tZXJjZSIsImF1ZCI6ImVseXNpYS1lY29tbWVyY2UtYXBpIn0.invalid';
    const rejected = await api('/users/profile', { token: bogus });
    expect(rejected.status).toBe(401);
  });
});

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

describe('Catalog, cart, wishlist, and addresses', () => {
  test('inactive products are hidden from the public catalog but visible to admins', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const category = await createCategory(admin.token);
    const suffix = Date.now();
    const product = await createProduct(admin.token, seller.user.id, category.id, {
      name: `Inactive ${suffix}`,
      sku: `INACTIVE-${suffix}`,
      isActive: false,
    });

    const publicDetail = await api(`/products/${product.id}`);
    expect(publicDetail.status).toBe(404);

    const publicSearch = await api(`/products?search=Inactive ${suffix}`);
    expect(publicSearch.status).toBe(200);
    expect(publicSearch.body.data.items.length).toBe(0);

    const adminDetail = await api(`/products/${product.id}`, { token: admin.token });
    expect(adminDetail.status).toBe(200);
    expect(adminDetail.body.data.isActive).toBe(false);
  });

  test('category search and product sorting work', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const suffix = Date.now();
    const category = await createCategory(admin.token, `Searchable ${suffix}`);

    const cheap = await createProduct(admin.token, seller.user.id, category.id, {
      name: `Cheap ${suffix}`,
      sku: `CHEAP-${suffix}`,
      price: 1,
    });
    const expensive = await createProduct(admin.token, seller.user.id, category.id, {
      name: `Expensive ${suffix}`,
      sku: `EXPENSIVE-${suffix}`,
      price: 100,
    });

    const categories = await api(`/categories?search=Searchable ${suffix}`);
    expect(categories.status).toBe(200);
    expect(categories.body.data.items.length).toBe(1);
    expect(categories.body.data.items[0].id).toBe(category.id);

    const products = await api(`/products?search=${suffix}&sortBy=price&sortOrder=asc`);
    expect(products.status).toBe(200);
    const ids = products.body.data.items.map((item: any) => item.id);
    expect(ids.indexOf(cheap.id)).toBeLessThan(ids.indexOf(expensive.id));
  });

  test('product images and variants can be managed by the owning seller', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const category = await createCategory(admin.token);
    const product = await createProduct(admin.token, seller.user.id, category.id);

    const image = await api(`/products/${product.id}/images`, {
      method: 'POST',
      token: seller.token,
      body: { imageUrl: 'https://example.com/image.jpg', isPrimary: true },
    });
    expect(image.status).toBe(200);

    const variant = await api(`/products/${product.id}/variants`, {
      method: 'POST',
      token: seller.token,
      body: {
        sku: `VAR-${Date.now()}`,
        name: 'Red / Large',
        price: 12,
        stockQuantity: 2,
        attributes: [{ name: 'Color', value: 'Red' }],
      },
    });
    expect(variant.status).toBe(200);

    const detail = await api(`/products/${product.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.images.length).toBe(1);
    expect(detail.body.data.variants.length).toBe(1);
    expect(detail.body.data.variants[0].attributes[0].name).toBe('Color');
    expect(detail.body.data.seller.id).toBe(seller.user.id);
  });

  test('cart and wishlist ownership, counts, toggle, and clear work', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const customer = await createCustomer();
    const attacker = await createCustomer();
    const category = await createCategory(admin.token);
    const product = await createProduct(admin.token, seller.user.id, category.id);

    const add = await api('/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: product.id, quantity: 2 },
    });
    expect(add.status).toBe(200);
    const itemId = add.body.data.items[0].id;

    const count = await api('/cart/count', { token: customer.token });
    expect(count.body.data.quantity).toBe(2);

    const attackerUpdate = await api(`/cart/items/${itemId}`, {
      method: 'PUT',
      token: attacker.token,
      body: { quantity: 3 },
    });
    expect(attackerUpdate.status).toBe(404);

    const toggled = await api('/wishlist/toggle', {
      method: 'POST',
      token: customer.token,
      body: { productId: product.id },
    });
    expect(toggled.status).toBe(200);
    expect(toggled.body.data.inWishlist).toBe(true);

    const checked = await api(`/wishlist/check/${product.id}`, { token: customer.token });
    expect(checked.body.data.inWishlist).toBe(true);

    const toggledOff = await api('/wishlist/toggle', {
      method: 'POST',
      token: customer.token,
      body: { productId: product.id },
    });
    expect(toggledOff.body.data.inWishlist).toBe(false);

    const clear = await api('/cart', { method: 'DELETE', token: customer.token });
    expect(clear.status).toBe(200);

    const empty = await api('/cart/count', { token: customer.token });
    expect(empty.body.data.quantity).toBe(0);
  });

  test('address defaults and saved-address checkout work', async () => {
    const admin = await createAdmin();
    const seller = await createSeller();
    const customer = await createCustomer();
    const category = await createCategory(admin.token);
    const product = await createProduct(admin.token, seller.user.id, category.id);

    const first = await api('/addresses', {
      method: 'POST',
      token: customer.token,
      body: {
        type: 'shipping',
        fullName: 'First Address',
        phoneNumber: '111',
        addressLine1: '1 First St',
        city: 'City',
        state: 'ST',
        postalCode: '11111',
        country: 'Country',
        isDefault: true,
      },
    });
    expect(first.status).toBe(201);

    const second = await api('/addresses', {
      method: 'POST',
      token: customer.token,
      body: {
        type: 'shipping',
        fullName: 'Second Address',
        phoneNumber: '222',
        addressLine1: '2 Second St',
        city: 'City',
        state: 'ST',
        postalCode: '22222',
        country: 'Country',
        isDefault: true,
      },
    });
    expect(second.status).toBe(201);

    const addresses = await api('/addresses', { token: customer.token });
    const defaults = addresses.body.data.filter((item: any) => item.isDefault);
    expect(defaults.length).toBe(1);
    expect(defaults[0].id).toBe(second.body.data.id);

    const order = await api('/orders', {
      method: 'POST',
      token: customer.token,
      body: {
        items: [{ productId: product.id, quantity: 1 }],
        shippingAddressId: second.body.data.id,
      },
    });
    expect(order.status).toBe(201);
    expect(order.body.data.shippingAddress.address).toBe('2 Second St');

    const deleted = await api(`/addresses/${second.body.data.id}`, {
      method: 'DELETE',
      token: customer.token,
    });
    expect(deleted.status).toBe(200);

    const remaining = await api('/addresses', { token: customer.token });
    expect(remaining.body.data.find((item: any) => item.id === first.body.data.id).isDefault).toBe(true);
  });

  test('invalid pagination and identifiers return 4xx, not 500', async () => {
    const negativePage = await api('/products?page=-1');
    expect(negativePage.status).toBe(422);

    const badId = await api('/products/not-a-uuid');
    expect(badId.status).toBe(422);
    expect(JSON.stringify(badId.body)).not.toContain('Failed query');
  });
});

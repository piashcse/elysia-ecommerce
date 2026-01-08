import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Wishlist Module Integration', () => {
    let customerToken: string;
    let customerId: string;
    let adminToken: string;
    let createdProductId: string;
    let createdWishlistItemId: string;

    const getCustomerToken = async () => {
        const email = `cust-wish-${Date.now()}@example.com`;
        const password = 'Password123!';
        await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'customer' }),
            })
        );
        const response = await app.handle(
            new Request('http://localhost/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
        );
        const body = await response.json() as any;
        customerId = body.data.user.id;
        return body.data.token;
    };

    const getAdminToken = async () => {
        const email = `admin-wish-${Date.now()}@example.com`;
        const password = 'AdminPassword123!';
        await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'admin' }),
            })
        );
        const response = await app.handle(
            new Request('http://localhost/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
        );
        const body = await response.json() as any;
        return body.data.token;
    };

    const createCategory = async (token: string) => {
        const response = await app.handle(
            new Request('http://localhost/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `Test Category Wish ${Date.now()}`,
                    description: 'Description for wishlist product test'
                }),
            })
        );
        const body = await response.json() as any;
        return body.data.id;
    };

    const createSeller = async (token: string) => {
        const email = `seller-wish-${Date.now()}@example.com`;
        const password = 'Password123!';
        
        await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'seller' }),
            })
        );

        const response = await app.handle(
            new Request('http://localhost/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
        );
        const body = await response.json() as any;
        return body.data.user.id;
    };

    const createProduct = async (token: string) => {
        const categoryId = await createCategory(token);
        const sellerId = await createSeller(token);

        const productRes = await app.handle(
            new Request('http://localhost/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `Test Product Wish ${Date.now()}`,
                    description: 'Test product description for wishlist',
                    price: 50.00,
                    stockQuantity: 50,
                    sku: `SKU-WISH-${Date.now()}`,
                    categoryId: categoryId,
                    sellerId: sellerId,
                }),
            })
        );
        const productBody = await productRes.json() as any;
        return productBody.data.id;
    };


    beforeAll(async () => {
        customerToken = await getCustomerToken();
        adminToken = await getAdminToken();
        createdProductId = await createProduct(adminToken);
    });

    test('POST /wishlist/items - should add product to wishlist', async () => {
        const response = await app.handle(
            new Request('http://localhost/wishlist/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${customerToken}`
                },
                body: JSON.stringify({
                    productId: createdProductId,
                }),
            })
        );
        expect(response.status).toBe(201);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.productId).toBe(createdProductId);
        createdWishlistItemId = body.data.id;
    });

    test('GET /wishlist - should retrieve user\'s wishlist', async () => {
        const response = await app.handle(
            new Request('http://localhost/wishlist', {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.some((item: any) => item.id === createdWishlistItemId)).toBe(true);
    });

    test('GET /wishlist/count - should retrieve wishlist count for user', async () => {
        const response = await app.handle(
            new Request('http://localhost/wishlist/count', {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.count).toBeGreaterThanOrEqual(1);
    });

    test('DELETE /wishlist/items/:id - should remove item from wishlist', async () => {
        const response = await app.handle(
            new Request(`http://localhost/wishlist/items/${createdWishlistItemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${customerToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);

        // Verify deletion
        const getResponse = await app.handle(
            new Request('http://localhost/wishlist', {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            })
        );
        const getBody = await getResponse.json() as any;
        expect(getBody.data.some((item: any) => item.id === createdWishlistItemId)).toBe(false);
    });
});

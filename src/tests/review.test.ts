import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Review Module Integration', () => {
    let customerToken: string;
    let adminToken: string;
    let createdProductId: string;
    let createdReviewId: string;
    let createdSellerId: string;

    const getCustomerToken = async () => {
        const email = `cust-review-${Date.now()}@example.com`;
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
        return body.data.token;
    };

    const getAdminToken = async () => {
        const email = `admin-review-${Date.now()}@example.com`;
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

    // Helper to create a seller
    const createSeller = async (token: string) => {
        const email = `seller-review-${Date.now()}@example.com`;
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

    // Helper to create a product
    const createProduct = async (token: string, sellerId: string) => {
        const categoryRes = await app.handle(
            new Request('http://localhost/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `Test Category ${Date.now()}`,
                    description: 'Description'
                }),
            })
        );
        const categoryBody = await categoryRes.json() as any;
        const categoryId = categoryBody.data.id;

        const productRes = await app.handle(
            new Request('http://localhost/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `Test Product ${Date.now()}`,
                    description: 'Test product description',
                    price: 25.00,
                    stockQuantity: 100,
                    sku: `TP-${Date.now()}`,
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
        createdSellerId = await createSeller(adminToken); // Create seller before product
        createdProductId = await createProduct(adminToken, createdSellerId);
    });

    test('POST /reviews - should create a review', async () => {
        const response = await app.handle(
            new Request('http://localhost/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${customerToken}`
                },
                body: JSON.stringify({
                    productId: createdProductId,
                    rating: 5,
                    title: 'Great Product!',
                    comment: 'I really enjoyed this product, highly recommended.'
                }),
            })
        );
        expect(response.status).toBe(201);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.rating).toBe(5);
        createdReviewId = body.data.id;
    });

    test('GET /reviews/product/:productId - should get reviews for a product', async () => {
        const response = await app.handle(
            new Request(`http://localhost/reviews/product/${createdProductId}`)
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
        expect(body.data.items.some((r: any) => r.id === createdReviewId)).toBe(true);
    });

    test('GET /reviews/my-reviews - should get user\'s reviews', async () => {
        const response = await app.handle(
            new Request('http://localhost/reviews/my-reviews', {
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
        expect(body.data.items.some((r: any) => r.id === createdReviewId)).toBe(true);
    });

    test('PUT /reviews/:id - should update a review', async () => {
        const response = await app.handle(
            new Request(`http://localhost/reviews/${createdReviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${customerToken}`
                },
                body: JSON.stringify({
                    rating: 4,
                    comment: 'It was good, but not perfect.'
                }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.rating).toBe(4);
    });

    test('POST /reviews/:id/helpful - should mark review as helpful', async () => {
        const response = await app.handle(
            new Request(`http://localhost/reviews/${createdReviewId}/helpful`, {
                method: 'POST',
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.helpfulCount).toBeGreaterThanOrEqual(1);
    });

    test('DELETE /reviews/:id - should delete a review', async () => {
        const response = await app.handle(
            new Request(`http://localhost/reviews/${createdReviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);

        // Verify deletion
        const getResponse = await app.handle(
            new Request(`http://localhost/reviews/my-reviews`, {
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        const getBody = await getResponse.json() as any;
        expect(getBody.data.items.some((r: any) => r.id === createdReviewId)).toBe(false);
    });
});

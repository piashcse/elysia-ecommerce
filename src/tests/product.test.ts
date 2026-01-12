import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Product Module Integration', () => {
    let adminToken: string;
    let createdCategoryId: string;
    let createdSellerId: string;
    let createdProductId: string;

    // Helper to get admin token
    const getAdminToken = async () => {
        const email = `admin-prod-${Date.now()}@example.com`;
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

    // Helper to create a category
    const createCategory = async (token: string) => {
        const response = await app.handle(
            new Request('http://localhost/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `Test Category Prod ${Date.now()}`,
                    description: 'Description for product test'
                }),
            })
        );
        const body = await response.json() as any;
        return body.data.id;
    };

    // Helper to create a seller
    const createSeller = async (token: string) => {
        const email = `seller-prod-${Date.now()}@example.com`;
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


    beforeAll(async () => {
        adminToken = await getAdminToken();
        createdCategoryId = await createCategory(adminToken);
        createdSellerId = await createSeller(adminToken);
    });

    test('POST /products - should create product (Admin)', async () => {
        const response = await app.handle(
            new Request('http://localhost/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: 'Test Product',
                    description: 'Descr',
                    price: 100,
                    stockQuantity: 10,
                    sku: `SKU-${Date.now()}`,
                    categoryId: createdCategoryId,
                    sellerId: createdSellerId
                }),
            })
        );
        expect(response.status).toBe(201);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.name).toBe('Test Product');
        createdProductId = body.data.id;
    });

    test('GET /products - should list products', async () => {
        const response = await app.handle(
            new Request('http://localhost/products')
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
        expect(body.data.items.some((p: any) => p.id === createdProductId)).toBe(true);
    });

    test('GET /products/:id - should get product by ID', async () => {
        const response = await app.handle(
            new Request(`http://localhost/products/${createdProductId}`)
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(createdProductId);
    });

    test('PUT /products/:id - should update product', async () => {
        const response = await app.handle(
            new Request(`http://localhost/products/${createdProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    price: 120,
                    description: 'Updated Description',
                }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.price).toBe('120.00'); // Price is stored as string
        expect(body.data.description).toBe('Updated Description');
    });

    test('DELETE /products/:id - should delete product', async () => {
        const response = await app.handle(
            new Request(`http://localhost/products/${createdProductId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);

        // Verify deletion
        const getResponse = await app.handle(
            new Request(`http://localhost/products/${createdProductId}`)
        );
        expect(getResponse.status).toBe(404);
    });
});

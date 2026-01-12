import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Category Module Integration', () => {
    let adminToken: string;
    let createdCategoryId: string;

    const getAdminToken = async () => {
        const email = `admin-cat-${Date.now()}@example.com`;
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

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    test('POST /categories - should create category (Admin)', async () => {
        const response = await app.handle(
            new Request('http://localhost/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: 'Test Category',
                    description: 'Testing'
                }),
            })
        );
        expect(response.status).toBe(201);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.name).toBe('Test Category');
        createdCategoryId = body.data.id;
    });

    test('GET /categories - should list categories', async () => {
        const response = await app.handle(
            new Request('http://localhost/categories')
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
    });

    test('PUT /categories/:id - should update category', async () => {
        if (!createdCategoryId) return;
        const response = await app.handle(
            new Request(`http://localhost/categories/${createdCategoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: 'Updated Category'
                }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.data.name).toBe('Updated Category');
    });

    test('DELETE /categories/:id - should delete category', async () => {
        if (!createdCategoryId) return;
        const response = await app.handle(
            new Request(`http://localhost/categories/${createdCategoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
            })
        );
        expect(response.status).toBe(200);
    });
});

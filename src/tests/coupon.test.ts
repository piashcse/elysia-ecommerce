import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Coupon Module Integration', () => {
    let adminToken: string;
    let createdCouponId: string;

    const getAdminToken = async () => {
        const email = `admin-coupon-${Date.now()}@example.com`;
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

    test('POST /coupons - should create coupon', async () => {
        const response = await app.handle(
            new Request('http://localhost/coupons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    code: 'TEST2024',
                    discountType: 'percentage',
                    discountValue: 10,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 86400000).toISOString()
                }),
            })
        );
        expect(response.status).toBe(201);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.code).toBe('TEST2024');
        createdCouponId = body.data.id;
    });

    test('GET /coupons - should list coupons', async () => {
        const response = await app.handle(
            new Request('http://localhost/coupons')
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.items.length).toBeGreaterThan(0);
    });

    test('PUT /coupons/:id - should update coupon', async () => {
        if (!createdCouponId) return;
        const response = await app.handle(
            new Request(`http://localhost/coupons/${createdCouponId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    description: 'Updated Description'
                }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.data.description).toBe('Updated Description');
    });

    test('DELETE /coupons/:id - should delete coupon', async () => {
        if (!createdCouponId) return;
        const response = await app.handle(
            new Request(`http://localhost/coupons/${createdCouponId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
            })
        );
        expect(response.status).toBe(200);
    });
});

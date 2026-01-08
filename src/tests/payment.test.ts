import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Payment Module Integration', () => {
    let adminToken: string;

    const getAdminToken = async () => {
        const email = `admin-pay-${Date.now()}@example.com`;
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

    test('GET /payments - should list payments (Admin)', async () => {
        const response = await app.handle(
            new Request('http://localhost/payments', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
    });
});

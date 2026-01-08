import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Cart Module Integration', () => {
    let customerToken: string;

    // Helper
    const getCustomerToken = async () => {
        const email = `cust-cart-${Date.now()}@example.com`;
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

    beforeAll(async () => {
        customerToken = await getCustomerToken();
    });

    test('GET /cart - should return empty cart initially or create one', async () => {
        const response = await app.handle(
            new Request('http://localhost/cart', {
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        // It might be null if not created, or empty object.
        // The controller returns `cart || null`.
    });

    test('DELETE /cart - should clear cart', async () => {
        const response = await app.handle(
            new Request('http://localhost/cart', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        expect(response.status).toBe(200);
    });
});

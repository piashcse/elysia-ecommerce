import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Notification Module Integration', () => {
    let userToken: string;

    const getUserToken = async () => {
        const email = `notif-user-${Date.now()}@example.com`;
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
        userToken = await getUserToken();
    });

    test('GET /notifications - should list notifications', async () => {
        const response = await app.handle(
            new Request('http://localhost/notifications', {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
    });

    test('PATCH /notifications/read/all - should mark all as read', async () => {
        const response = await app.handle(
            new Request('http://localhost/notifications/read/all', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
            })
        );
        expect(response.status).toBe(200);
    });
});

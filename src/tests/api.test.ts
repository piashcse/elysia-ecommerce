import { expect, test, describe } from 'bun:test';
import app from '../server';

describe('E-commerce API Tests', () => {
    let authToken: string;
    let userId: string;

    const getAuthToken = async () => {
        if (authToken) return authToken;

        const email = `test-${Date.now()}@example.com`;
        const password = 'Password123!';

        // Register
        await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName: 'Test', lastName: 'User', role: 'customer' }),
            })
        );

        // Login
        const response = await app.handle(
            new Request('http://localhost/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
        );

        const body = await response.json() as any;
        authToken = body.data.token;
        userId = body.data.user.id;
        return authToken;
    };

    const getAdminToken = async () => {
        const email = `admin-${Date.now()}@example.com`;
        const password = 'AdminPassword123!';

        // Register Admin
        await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName: 'Admin', lastName: 'User', role: 'admin' }),
            })
        );

        // Login
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

    describe('Health Check', () => {
        test('GET /health returns 200', async () => {
            const response = await app.handle(
                new Request('http://localhost/health')
            );
            expect(response.status).toBe(200);
            const data = await response.json() as any;
            expect(data.status).toBe('OK');
        });

        test('GET /swagger returns 200 or 301/302', async () => {
            const response = await app.handle(
                new Request('http://localhost/swagger')
            );
            expect([200, 301, 302]).toContain(response.status);
        });
    });

    describe('Auth Module', () => {
        test('POST /auth/register and /auth/login works', async () => {
            const token = await getAuthToken();
            expect(token).toBeDefined();
        });

        test('POST /auth/register with invalid data returns 422', async () => {
            const response = await app.handle(
                new Request('http://localhost/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'invalid' }),
                })
            );
            expect(response.status).toBe(422);
        });
    });

    describe('User Module', () => {
        test('GET /users/profile returns 200', async () => {
            const token = await getAuthToken();
            const response = await app.handle(
                new Request('http://localhost/users/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );
            expect(response.status).toBe(200);
        });
    });

    describe('Product Module', () => {
        test('GET /products returns products', async () => {
            const response = await app.handle(
                new Request('http://localhost/products')
            );
            expect(response.status).toBe(200);
        });
    });

    describe('Cart Module', () => {
        test('POST /cart/items adds item', async () => {
            const token = await getAuthToken();
            const prodRes = await app.handle(new Request('http://localhost/products'));
            const prodData = await prodRes.json() as any;
            const productId = prodData.data.items[0]?.id;

            if (productId) {
                const response = await app.handle(
                    new Request('http://localhost/cart/items', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ productId, quantity: 1 }),
                    })
                );
                expect(response.status).toBe(200);
            }
        });

        test('GET /cart returns cart', async () => {
            const token = await getAuthToken();
            const response = await app.handle(
                new Request('http://localhost/cart', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );
            expect(response.status).toBe(200);
        });
    });

    describe('Address Module', () => {
        test('POST /addresses creates address', async () => {
            const token = await getAuthToken();
            const response = await app.handle(
                new Request('http://localhost/addresses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'shipping',
                        fullName: 'Test User',
                        phoneNumber: '1234567890',
                        addressLine1: 'Test Address',
                        city: 'Test City',
                        state: 'TS',
                        postalCode: '12345',
                        country: 'TC'
                    }),
                })
            );
            expect(response.status).toBe(201);
        });
    });

    describe('Order Module', () => {
        test('GET /orders returns orders', async () => {
            const token = await getAuthToken();
            const response = await app.handle(
                new Request('http://localhost/orders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );
            expect(response.status).toBe(200);
        });
    });

    describe('Coupon Module', () => {
        test('GET /coupons returns list', async () => {
            const response = await app.handle(new Request('http://localhost/coupons'));
            expect(response.status).toBe(200);
        });
    });

    describe('Shipping Module', () => {
        test('GET /shipping-methods returns list', async () => {
            const response = await app.handle(new Request('http://localhost/shipping-methods'));
            expect(response.status).toBe(200);
        });
    });

    describe('Review Module', () => {
        test('GET /reviews/product/:id returns list', async () => {
            const prodRes = await app.handle(new Request('http://localhost/products'));
            const prodData = await prodRes.json() as any;
            const productId = prodData.data.items[0]?.id;

            if (productId) {
                const response = await app.handle(
                    new Request(`http://localhost/reviews/product/${productId}`)
                );
                expect(response.status).toBe(200);
            }
        });
    });

    describe('Notification Module', () => {
        test('GET /notifications returns list', async () => {
            const token = await getAuthToken();
            const response = await app.handle(
                new Request('http://localhost/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );
            expect(response.status).toBe(200);
        });
    });

    describe('Payment Module', () => {
        test('GET /payments returns list', async () => {
            const token = await getAuthToken();
            const response = await app.handle(
                new Request('http://localhost/payments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );
            expect(response.status).toBe(200);
        });
    });
});

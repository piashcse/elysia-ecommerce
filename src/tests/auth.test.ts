import { describe, expect, test } from 'bun:test';
import app from '../server';

describe('Auth Module Integration', () => {
    const testEmail = `test-auth-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    let authToken: string;

    test('POST /auth/register - should register a new user successfully', async () => {
        const response = await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword,
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'customer'
                }),
            })
        );

        expect(response.status).toBe(201);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(testEmail);
        expect(body.data.role).toBe('customer');
        expect(body.data.password).toBeUndefined(); // Ensure password is not returned
    });

    test('POST /auth/register - should fail with existing email', async () => {
        const response = await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword,
                    firstName: 'Other',
                    lastName: 'User'
                }),
            })
        );

        // Expect 409 Conflict (or whatever the service throws)
        // AuthService throws ConflictError, handled by onError
        expect(response.status).toBe(409);
    });

    test('POST /auth/register - should fail with invalid email', async () => {
        const response = await app.handle(
            new Request('http://localhost/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: testPassword
                }),
            })
        );
        expect(response.status).toBe(422); // Validation error
    });

    test('POST /auth/login - should login successfully', async () => {
        const response = await app.handle(
            new Request('http://localhost/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword
                }),
            })
        );

        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.token).toBeDefined();
        authToken = body.data.token;
    });

    test('POST /auth/login - should fail with wrong password', async () => {
        const response = await app.handle(
            new Request('http://localhost/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: 'WrongPassword'
                }),
            })
        );

        expect(response.status).toBe(401);
    });
});

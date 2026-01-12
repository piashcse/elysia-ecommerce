import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('User Module Integration', () => {
    let customerToken: string;
    let customerId: string;
    let adminToken: string;
    let adminId: string;
    let testUserEmail: string;
    let testUserPassword: string;

    const getCustomerToken = async () => {
        const email = `cust-user-${Date.now()}@example.com`;
        const password = 'Password123!';
        testUserEmail = email;
        testUserPassword = password;

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
        const email = `admin-user-${Date.now()}@example.com`;
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
        adminId = body.data.user.id;
        return body.data.token;
    };

    beforeAll(async () => {
        customerToken = await getCustomerToken();
        adminToken = await getAdminToken();
    });

    test('GET /users/profile - should get current user profile', async () => {
        const response = await app.handle(
            new Request('http://localhost/users/profile', {
                headers: { 'Authorization': `Bearer ${customerToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(customerId);
        expect(body.data.email).toBe(testUserEmail);
    });

    test('PUT /users/profile - should update current user profile', async () => {
        const newFirstName = 'Jane';
        const response = await app.handle(
            new Request('http://localhost/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${customerToken}`
                },
                body: JSON.stringify({ firstName: newFirstName }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.firstName).toBe(newFirstName);
    });

    test('PUT /users/change-password - should change current user password', async () => {
        const newPassword = 'NewPassword123!';
        const response = await app.handle(
            new Request('http://localhost/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${customerToken}`
                },
                body: JSON.stringify({
                    currentPassword: testUserPassword,
                    newPassword: newPassword
                }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);

        // Update testUserPassword for subsequent tests if any
        testUserPassword = newPassword;
    });

    test('GET /users - should get all users (Admin only)', async () => {
        const response = await app.handle(
            new Request('http://localhost/users', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);
        expect(body.data.items.length).toBeGreaterThanOrEqual(2); // At least customer and admin
    });

    test('GET /users/:id - should get user by ID (Admin)', async () => {
        const response = await app.handle(
            new Request(`http://localhost/users/${customerId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(customerId);
    });

    test('PUT /users/:id - should update user by ID (Admin)', async () => {
        const newLastName = 'Doe Updated';
        const response = await app.handle(
            new Request(`http://localhost/users/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ lastName: newLastName }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.lastName).toBe(newLastName);
    });

    test('DELETE /users/:id - should delete user by ID (Admin)', async () => {
        const response = await app.handle(
            new Request(`http://localhost/users/${customerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);

        // Verify deletion
        const getResponse = await app.handle(
            new Request(`http://localhost/users/${customerId}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            })
        );
        expect(getResponse.status).toBe(404);
    });
});

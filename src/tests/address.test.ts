import { describe, expect, test, beforeAll } from 'bun:test';
import app from '../server';

describe('Address Module Integration', () => {
    let customerToken: string;
    let createdAddressId: string;

    const getCustomerToken = async () => {
        const email = `cust-addr-${Date.now()}@example.com`;
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

    test('POST /addresses - should create address', async () => {
        const response = await app.handle(
            new Request('http://localhost/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${customerToken}`
                },
                body: JSON.stringify({
                    type: 'shipping',
                    fullName: 'John Doe',
                    phoneNumber: '1234567890',
                    addressLine1: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'USA'
                }),
            })
        );
        expect(response.status).toBe(201);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(body.data.city).toBe('New York');
        createdAddressId = body.data.id;
    });

    test('GET /addresses - should list addresses', async () => {
        const response = await app.handle(
            new Request('http://localhost/addresses', {
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true); // Address endpoint returns list directly or object with items?
        // AddressController: return successResponse(addresses) -> addresses is array.
        // successResponse wrapper adds { success, data: addresses, ... }
        expect(body.data.some((a: any) => a.id === createdAddressId)).toBe(true);
    });

    test('PUT /addresses/:id - should update address', async () => {
        if (!createdAddressId) return;
        const response = await app.handle(
            new Request(`http://localhost/addresses/${createdAddressId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${customerToken}`
                },
                body: JSON.stringify({
                    city: 'Los Angeles'
                }),
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.data.city).toBe('Los Angeles');
    });

    test('DELETE /addresses/:id - should delete address', async () => {
        if (!createdAddressId) return;
        const response = await app.handle(
            new Request(`http://localhost/addresses/${createdAddressId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        expect(response.status).toBe(200);

        // Verify deletion
        const getResponse = await app.handle(
            new Request(`http://localhost/addresses/${createdAddressId}`, {
                headers: {
                    'Authorization': `Bearer ${customerToken}`
                },
            })
        );
        expect(getResponse.status).toBe(404);
    });
});

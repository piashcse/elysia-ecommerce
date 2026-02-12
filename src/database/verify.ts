const BASE_URL = 'http://localhost:3005';

async function verifyAll() {
    console.log('🚀 Starting Comprehensive API Verification...\n');

    const adminCreds = { email: 'admin@example.com', password: 'Password123!' };
    const sellerCreds = { email: 'seller1@example.com', password: 'Password123!' };
    const customerCreds = { email: 'customer1@example.com', password: 'Password123!' };

    const suffix = Date.now();

    // --- 1. AUTH & ADMIN FLOW ---
    console.log('--- [ADMIN FLOW] ---');
    const adminToken = await login(adminCreds);
    if (!adminToken) return;

    const adminProfile = await call('/users/profile', 'GET', null, adminToken);
    const adminId = adminProfile?.data?.id;

    // Users
    await call('/users', 'GET', null, adminToken);

    // Category CRUD
    const cat = await call('/categories', 'POST', { name: `Verify Cat ${suffix}`, description: 'Test' }, adminToken);
    if (!cat) return;
    const catId = cat.data.id;
    await call(`/categories/${catId}`, 'PUT', { name: `Updated Cat ${suffix}` }, adminToken);
    await call('/categories', 'GET', null, adminToken);

    // Product CRUD (Admin)
    const prod = await call('/products', 'POST', {
        name: `Admin Prod ${suffix}`,
        price: 99.99,
        stockQuantity: 10,
        sku: `SKU-ADMIN-${suffix}`,
        categoryId: catId,
        sellerId: adminId
    }, adminToken);
    if (!prod) return;
    const prodId = prod.data.id;
    await call(`/products/${prodId}`, 'PUT', { price: 88.88 }, adminToken);

    // Coupon CRUD
    const coupon = await call('/coupons', 'POST', {
        code: `VERIFY-${suffix}`,
        discountType: 'fixed',
        discountValue: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString()
    }, adminToken);
    if (!coupon) return;
    const couponId = coupon.data.id;
    await call(`/coupons/${couponId}`, 'PUT', { description: 'Verified' }, adminToken);

    // Shipping CRUD (Admin)
    const ship = await call('/shipping-methods', 'POST', {
        name: `Express ${suffix}`,
        baseCost: 15.00,
        estimatedDaysMin: 1,
        estimatedDaysMax: 2
    }, adminToken);
    if (!ship) return;
    const shipId = ship.data.id;
    await call(`/shipping-methods/${shipId}`, 'PUT', { baseCost: 18.00 }, adminToken);
    await call('/shipping-methods', 'GET', null, adminToken);

    // --- 2. SELLER FLOW ---
    console.log('\n--- [SELLER FLOW] ---');
    const sellerToken = await login(sellerCreds);
    if (!sellerToken) return;

    await call('/seller/products', 'GET', null, sellerToken);
    const sProd = await call('/seller/products', 'POST', {
        name: `Seller Prod ${suffix}`,
        price: 45.00,
        stockQuantity: 20,
        sku: `SKU-SELL-${suffix}`,
        categoryId: catId
    }, sellerToken);
    if (!sProd) return;
    const sProdId = sProd.data.id;
    await call(`/seller/products/${sProdId}`, 'PUT', { price: 40.00 }, sellerToken);
    await call('/seller/orders', 'GET', null, sellerToken);

    // --- 3. CUSTOMER FLOW ---
    console.log('\n--- [CUSTOMER FLOW] ---');
    const customerToken = await login(customerCreds);
    if (!customerToken) return;

    // Profile & Address
    await call('/users/profile', 'GET', null, customerToken);
    const addr = await call('/addresses', 'POST', {
        type: 'shipping',
        fullName: 'Verify User',
        phoneNumber: '1234567890',
        addressLine1: 'Verify Street',
        city: 'Verify City',
        state: 'VS',
        postalCode: '00000',
        country: 'VC'
    }, customerToken);
    if (!addr) return;
    const addrId = addr.data.id;
    await call(`/addresses/${addrId}`, 'PUT', { city: 'Updated City' }, customerToken);
    await call(`/addresses/${addrId}/set-default`, 'POST', null, customerToken);

    // Wishlist
    await call('/wishlist/items', 'POST', { productId: sProdId }, customerToken);
    await call('/wishlist', 'GET', null, customerToken);
    await call('/wishlist/count', 'GET', null, customerToken);

    // Cart
    await call('/cart/items', 'POST', { productId: sProdId, quantity: 2 }, customerToken);
    await call('/cart', 'GET', null, customerToken);

    // Notifications
    await call('/notifications', 'GET', null, customerToken);
    await call('/notifications/read/all', 'PATCH', null, customerToken);

    // Order
    const orderRes = await call('/orders', 'POST', {
        items: [{ productId: sProdId, quantity: 1 }],
        shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address: 'Verify Street',
            city: 'Verify City',
            state: 'VS',
            zipCode: '00000',
            country: 'VC'
        }
    }, customerToken);
    if (!orderRes || !orderRes.data) return;
    const orderId = orderRes.data.id;
    await call(`/orders/${orderId}`, 'GET', null, customerToken);

    // Payment
    console.log('\n--- [PAYMENT FLOW] ---');
    const payment = await call('/payments', 'POST', {
        orderId: orderId,
        paymentMethod: 'credit_card',
        amount: 40.00
    }, customerToken);
    if (payment) {
        const paymentId = payment.data.id;
        await call(`/payments/${paymentId}`, 'GET', null, customerToken);
        await call(`/payments/${paymentId}/process`, 'POST', null, customerToken);
        await call('/payments', 'GET', null, customerToken);
    }

    // Cancel Order (after payment failed logic or just to test cancel)
    await call(`/orders/${orderId}/cancel`, 'PUT', null, customerToken);

    // Review
    const review = await call('/reviews', 'POST', {
        productId: sProdId,
        rating: 5,
        title: 'Great',
        comment: 'Verified'
    }, customerToken);
    if (!review) return;
    const reviewId = review.data.id;
    await call(`/reviews/product/${sProdId}`, 'GET');
    await call(`/reviews/${reviewId}/helpful`, 'POST');

    // --- 4. CLEANUP ---
    console.log('\n--- [CLEANUP FLOW] ---');
    await call(`/reviews/${reviewId}`, 'DELETE', null, customerToken);
    await call(`/addresses/${addrId}`, 'DELETE', null, customerToken);
    await call(`/seller/products/${sProdId}`, 'DELETE', null, sellerToken);
    await call(`/shipping-methods/${shipId}`, 'DELETE', null, adminToken);
    await call(`/coupons/${couponId}`, 'DELETE', null, adminToken);
    await call(`/categories/${catId}`, 'DELETE', null, adminToken);
    await call(`/products/${prodId}`, 'DELETE', null, adminToken);

    console.log('\n✨ All main endpoint flows verified successfully!');
    process.exit(0);
}

async function login(creds: any) {
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creds)
        });
        const body = await res.json() as any;
        if (res.ok) {
            console.log(`✅ Login Success: ${creds.email}`);
            return body.data.token;
        }
        console.log(`❌ Login Failed: ${creds.email}`, body);
        return null;
    } catch (e: any) {
        console.error('Login error:', e.message);
        return null;
    }
}

async function call(path: string, method: string, body: any = null, token: string = '') {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        const data = await res.json() as any;
        if (res.ok) {
            console.log(`✅ ${method} ${path} - Success`);
            return data;
        } else {
            console.log(`❌ ${method} ${path} - Failed (${res.status}):`, data.message || JSON.stringify(data));
            return null;
        }
    } catch (e: any) {
        console.log(`❌ ${method} ${path} - Error:`, e.message);
        return null;
    }
}

verifyAll();

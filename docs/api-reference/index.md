# API Reference

This reference documents **175 operations** across **26 modules**. It is generated from the application's OpenAPI schema.

All endpoints are served under the stable `/api/v1` prefix; unversioned routes remain for backwards compatibility.

| Module | Endpoints |
|--------|-----------|
| Addresses | 6 |
| Admin Reports & Audit | 2 |
| Authentication & API Keys | 15 |
| Brands | 6 |
| Cart | 7 |
| Categories | 8 |
| Checkout | 1 |
| Coupons & Discounts | 8 |
| Currencies & FX | 5 |
| Gift Cards | 4 |
| Media Uploads | 2 |
| Notifications & Email | 9 |
| Orders | 9 |
| Payments & Payment Methods | 10 |
| Products & Variants | 19 |
| Returns & RMA | 7 |
| Reviews & Ratings | 8 |
| Search & Synonyms | 3 |
| Seller Portal | 11 |
| SEO & Sitemap | 1 |
| Shipping Methods | 6 |
| System & Monitoring | 2 |
| Tax Rates | 4 |
| Translations & Localization | 6 |
| Users & Profiles | 10 |
| Wishlist | 6 |

## Modules

- [Authentication & API Keys](../authentication.md) — 15 endpoints
- [Users & Profiles](../users.md) — 10 endpoints
- [Seller Portal](../sellers.md) — 11 endpoints
- [Products & Variants](../products.md) — 19 endpoints
- [Categories](../categories.md) — 8 endpoints
- [Brands](../brands.md) — 6 endpoints
- [Reviews & Ratings](../reviews.md) — 8 endpoints
- [Translations & Localization](../translations.md) — 6 endpoints
- [Search & Synonyms](../search.md) — 3 endpoints
- [Cart](../cart.md) — 7 endpoints
- [Wishlist](../wishlist.md) — 6 endpoints
- [Checkout](../checkout.md) — 1 endpoint
- [Orders](../orders.md) — 9 endpoints
- [Payments & Payment Methods](../payments.md) — 10 endpoints
- [Coupons & Discounts](../coupons.md) — 8 endpoints
- [Gift Cards](../gift-cards.md) — 4 endpoints
- [Shipping Methods](../shipping.md) — 6 endpoints
- [Tax Rates](../taxes.md) — 4 endpoints
- [Addresses](../addresses.md) — 6 endpoints
- [Returns & RMA](../returns.md) — 7 endpoints
- [Notifications & Email](../notifications.md) — 9 endpoints
- [Currencies & FX](../currencies.md) — 5 endpoints
- [Media Uploads](../media.md) — 2 endpoints
- [Admin Reports & Audit](../admin.md) — 2 endpoints
- [System & Monitoring](../system.md) — 2 endpoints
- [SEO & Sitemap](../seo.md) — 1 endpoint

## Addresses

Full details: [Addresses](../addresses.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/addresses/` | Get all user addresses | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/addresses/` | Create new address | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/addresses/{id}` | Get address by ID | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/addresses/{id}` | Update address | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/addresses/{id}` | Delete address | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/addresses/{id}/set-default` | Set address as default | Bearer |

## Admin Reports & Audit

Full details: [Admin Reports & Audit](../admin.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/admin/audit-logs/` | List audit logs (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/admin/reports/sales` | Sales and product reports (Admin only) | Bearer · Admin |

## Authentication & API Keys

Full details: [Authentication & API Keys](../authentication.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/api-keys/` | List API keys | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/api-keys/` | Create an API key | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/api-keys/{id}` | Revoke an API key | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/disable` | Disable two-factor authentication | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/enable` | Enable two-factor authentication | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/recovery-codes` | Regenerate two-factor recovery codes | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/setup` | Start two-factor authentication setup | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/forgot-password` | Request a password reset email | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/login` | Login user and get access/refresh tokens | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/logout` | Invalidate all sessions for the current user | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/refresh` | Exchange a refresh token for a new token pair | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/register` | Register a new customer account | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/resend-verification` | Resend the email verification link | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/reset-password` | Reset a password using a reset token | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/verify-email` | Verify an email address | Public |

## Brands

Full details: [Brands](../brands.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/brands/` | List brands | Public |
| <span class="method-badge post">POST</span> | `/api/v1/brands/` | Create a brand (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/brands/{id}` | Get a brand by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/brands/{id}` | Update a brand (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/brands/{id}` | Delete a brand (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/brands/slug/{slug}` | Get a brand by slug | Public |

## Cart

Full details: [Cart](../cart.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/cart/` | Get the current user's or guest cart | Guest session or Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/cart/` | Clear entire cart | Guest session or Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/cart/count` | Get the current cart's item count | Guest session or Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/cart/items` | Add item to cart | Guest session or Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/cart/items/{id}` | Update cart item quantity | Guest session or Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/cart/items/{id}` | Remove item from cart | Guest session or Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/cart/merge` | Merge the guest cart into the authenticated user cart | Bearer |

## Categories

Full details: [Categories](../categories.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/categories/` | Get all categories with pagination | Public |
| <span class="method-badge post">POST</span> | `/api/v1/categories/` | Create a new category (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/categories/{id}` | Get category by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/categories/{id}` | Update category by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/categories/{id}` | Delete category by ID (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/categories/{id}/products` | Get products in a specific category | Public |
| <span class="method-badge get">GET</span> | `/api/v1/categories/slug/{slug}` | Get a category by slug | Public |
| <span class="method-badge get">GET</span> | `/api/v1/categories/tree` | Get the category tree | Public |

## Checkout

Full details: [Checkout](../checkout.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge post">POST</span> | `/api/v1/checkout/quote` | Calculate order totals without creating an order | Guest session or Bearer |

## Coupons & Discounts

Full details: [Coupons & Discounts](../coupons.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/coupons/` | Get all coupons (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/coupons/` | Create a new coupon (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/coupons/{id}` | Get coupon by ID (Admin only) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/coupons/{id}` | Update coupon by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/coupons/{id}` | Delete coupon by ID (Admin only) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/coupons/{id}/scopes` | Set coupon product/category restrictions (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/coupons/code/{code}` | Get coupon by code | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/coupons/validate` | Validate a coupon against an order amount | Bearer |

## Currencies & FX

Full details: [Currencies & FX](../currencies.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/currencies/` | List active currencies | Public |
| <span class="method-badge post">POST</span> | `/api/v1/currencies/` | Create or replace a currency (Admin only) | Bearer · Admin |
| <span class="method-badge patch">PATCH</span> | `/api/v1/currencies/{code}` | Update a currency (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/currencies/{code}` | Deactivate a currency (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/currencies/convert` | Convert an amount between currencies | Public |

## Gift Cards

Full details: [Gift Cards](../gift-cards.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/gift-cards/` | List gift cards (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/gift-cards/` | Create a gift card (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/gift-cards/{code}` | Check a gift card balance | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/gift-cards/{id}` | Deactivate a gift card (Admin only) | Bearer · Admin |

## Media Uploads

Full details: [Media Uploads](../media.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge post">POST</span> | `/api/v1/uploads/` | Upload an image (Admin or Seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/uploads/{filename}` | Serve an uploaded file | Public |

## Notifications & Email

Full details: [Notifications & Email](../notifications.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/emails/` | List the email outbox (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/emails/process` | Process pending emails (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/notifications/` | Get all notifications for the authenticated user | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/notifications/{id}` | Delete a notification | Bearer |
| <span class="method-badge patch">PATCH</span> | `/api/v1/notifications/{id}/read` | Mark a notification as read | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/notifications/preferences` | Get notification preferences | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/notifications/preferences` | Update notification preferences | Bearer |
| <span class="method-badge patch">PATCH</span> | `/api/v1/notifications/read/all` | Mark all notifications as read | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/notifications/unread-count` | Get unread notification count | Bearer |

## Orders

Full details: [Orders](../orders.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/orders/` | Get orders (Admin: all, Customer: own) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/orders/` | Place a new order | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/orders/{id}` | Get order details by ID | Bearer or guest token |
| <span class="method-badge put">PUT</span> | `/api/v1/orders/{id}` | Update order status (Admin only) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/orders/{id}/cancel` | Cancel order | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/orders/{id}/events` | Get the order timeline | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/orders/{id}/invoice` | Download an order invoice (HTML) | Bearer or guest token |
| <span class="method-badge post">POST</span> | `/api/v1/orders/release-expired` | Release expired pending orders (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/orders/stats` | Get order statistics (Admin only) | Bearer · Admin |

## Payments & Payment Methods

Full details: [Payments & Payment Methods](../payments.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/payment-methods/` | List saved payment methods | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/payment-methods/` | Save a tokenized payment method | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/payment-methods/{id}` | Delete a saved payment method | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/payments/` | Get payments (Admin: all, Customer: own) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/payments/` | Create initial payment record | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/payments/{id}` | Get payment details by ID | Bearer or guest token |
| <span class="method-badge post">POST</span> | `/api/v1/payments/{id}/complete` | Mark an offline payment as completed (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/payments/{id}/refund` | Refund a completed payment (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/payments/process` | Process payment with gateway simulation | Bearer or guest token |
| <span class="method-badge post">POST</span> | `/api/v1/payments/webhook` | Receive a payment provider webhook | Provider signature |

## Products & Variants

Full details: [Products & Variants](../products.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/products/` | Get all products with filters | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/` | Create a new product (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}` | Get product by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/{id}` | Update product by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/{id}` | Delete product by ID (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/images` | Get product images | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/{id}/images` | Add a product image (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/questions` | List product questions and answers | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/{id}/questions` | Ask a product question | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/related` | Get related products | Public |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/variants` | Get product variants | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/{id}/variants` | Create a product variant (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/products/facets` | Get catalog facets | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/images/{imageId}` | Update a product image (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/images/{imageId}` | Delete a product image (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/products/slug/{slug}` | Get a product by slug | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/variants/{variantId}` | Update a product variant (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/variants/{variantId}` | Delete a product variant (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge post">POST</span> | `/api/v1/questions/{id}/answers` | Answer a product question (seller/admin) | Bearer · Admin/Seller |

## Returns & RMA

Full details: [Returns & RMA](../returns.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/returns/` | List returns (Admin: all, Customer: own) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/returns/` | Request a return | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/returns/{id}` | Get a return by ID | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/returns/{id}/approve` | Approve a return (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/returns/{id}/receive` | Mark a return as received and restore stock (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/returns/{id}/refund` | Refund a received return (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/returns/{id}/reject` | Reject a return (Admin only) | Bearer · Admin |

## Reviews & Ratings

Full details: [Reviews & Ratings](../reviews.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge post">POST</span> | `/api/v1/reviews/` | Create a product review | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/reviews/{id}` | Update your review | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/reviews/{id}` | Delete your review | Bearer |
| <span class="method-badge patch">PATCH</span> | `/api/v1/reviews/{id}/approve` | Approve or reject a review (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/reviews/{id}/helpful` | Mark a review as helpful (once per user) | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/reviews/my-reviews` | Get current user reviews | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/reviews/pending` | Get pending reviews (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/reviews/product/{productId}` | Get all approved reviews for a product | Public |

## Search & Synonyms

Full details: [Search & Synonyms](../search.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/admin/search/synonyms` | List search synonyms (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/admin/search/synonyms` | Create or replace a search synonym mapping (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/admin/search/synonyms/{id}` | Delete a search synonym mapping (Admin only) | Bearer · Admin |

## Seller Portal

Full details: [Seller Portal](../sellers.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/payouts/` | List seller payouts (Admin only) | Bearer · Admin/Seller |
| <span class="method-badge post">POST</span> | `/api/v1/payouts/` | Create a seller payout (Admin only) | Bearer · Admin/Seller |
| <span class="method-badge patch">PATCH</span> | `/api/v1/payouts/{id}` | Update payout status (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/seller/orders` | Get orders containing the current seller products | Bearer · Seller |
| <span class="method-badge put">PUT</span> | `/api/v1/seller/orders/{orderId}/items/{itemId}` | Update fulfillment status for a seller order item | Bearer · Seller |
| <span class="method-badge get">GET</span> | `/api/v1/seller/payouts` | Get seller payout balance and history | Bearer · Seller |
| <span class="method-badge get">GET</span> | `/api/v1/seller/products` | Get products for the current seller | Bearer · Seller |
| <span class="method-badge post">POST</span> | `/api/v1/seller/products` | Create a new product by seller | Bearer · Seller |
| <span class="method-badge put">PUT</span> | `/api/v1/seller/products/{id}` | Update product by seller | Bearer · Seller |
| <span class="method-badge delete">DELETE</span> | `/api/v1/seller/products/{id}` | Delete product by seller | Bearer · Seller |
| <span class="method-badge get">GET</span> | `/api/v1/seller/stats` | Get seller product and sales statistics | Bearer · Seller |

## SEO & Sitemap

Full details: [SEO & Sitemap](../seo.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/sitemap.xml` | SEO sitemap (XML) | Public |

## Shipping Methods

Full details: [Shipping Methods](../shipping.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/shipping-methods/` | Get all shipping methods | Public |
| <span class="method-badge post">POST</span> | `/api/v1/shipping-methods/` | Create a new shipping method (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/shipping-methods/{id}` | Get shipping method by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/shipping-methods/{id}` | Update shipping method by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/shipping-methods/{id}` | Delete shipping method by ID (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/shipping-methods/quote` | Calculate shipping options for a cart | Bearer |

## System & Monitoring

Full details: [System & Monitoring](../system.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/metrics` |  | Public |
| <span class="method-badge get">GET</span> | `/health` | Health check and database readiness | Public |

## Tax Rates

Full details: [Tax Rates](../taxes.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/tax-rates/` | List tax rates (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/tax-rates/` | Create a tax rate (Admin only) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/tax-rates/{id}` | Update a tax rate (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/tax-rates/{id}` | Delete a tax rate (Admin only) | Bearer · Admin |

## Translations & Localization

Full details: [Translations & Localization](../translations.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/categories/{id}/translations` | List category translations | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/categories/{id}/translations/{locale}` | Create or update a category translation (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/categories/{id}/translations/{locale}` | Delete a category translation (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/translations` | List product translations | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/{id}/translations/{locale}` | Create or update a product translation | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/{id}/translations/{locale}` | Delete a product translation | Bearer |

## Users & Profiles

Full details: [Users & Profiles](../users.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/users/` | Get all users (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/users/` | Create a user (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/users/{id}` | Get user by ID | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/users/{id}` | Update user by ID (Admin or Self) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/users/{id}` | Delete user by ID (Admin or Self) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/users/change-password` | Change user password | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/users/me` | Delete the current account and anonymize personal data | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/users/me/export` | Export the current user data | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/users/profile` | Get current user profile | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/users/profile` | Update current user profile | Bearer |

## Wishlist

Full details: [Wishlist](../wishlist.md)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/wishlist/` | Get current user's wishlist | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/wishlist/check/{productId}` | Check whether a product is in the wishlist | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/wishlist/count` | Get total wishlist count | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/wishlist/items` | Add product to wishlist | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/wishlist/items/{id}` | Remove item from wishlist | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/wishlist/toggle` | Toggle a product in the wishlist | Bearer |

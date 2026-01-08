import { Elysia, t } from 'elysia';
import { SellerService } from '../service/SellerService';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const sellerService = new SellerService();

export const sellerController = new Elysia({ prefix: '/seller', tags: ['Seller'] })
    .use(authPlugin)
    .guard({
        hasRole: UserRole.SELLER
    })
    .get('/products', async ({ user, query }) => {
        const userId = user!.sub as string;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const result = await sellerService.getSellerProducts(userId, page, limit);
        return paginatedResponse(result.products, { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }, 'Products retrieved successfully');
    }, {
        response: { 200: t.Any() },
        detail: { summary: 'Get products for the current seller' }
    })
    .post('/products', async ({ user, body, set }) => {
        const userId = user!.sub as string;
        const product = await sellerService.createProduct(userId, body);
        set.status = 201;
        return successResponse(product, 'Product created successfully', 201);
    }, {
        body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
            price: t.Number(),
            stockQuantity: t.Number(),
            sku: t.String(),
            imageUrl: t.Optional(t.String()),
            categoryId: t.String(),
        }),
        response: { 201: t.Any(), 400: t.Any() },
        detail: { summary: 'Create a new product by seller' }
    })
    .put('/products/:id', async ({ user, params, body }) => {
        const userId = user!.sub as string;
        const product = await sellerService.updateProduct(userId, params.id, body);
        return successResponse(product, 'Product updated successfully');
    }, {
        body: t.Partial(t.Object({
            name: t.String(),
            description: t.String(),
            price: t.Number(),
            stockQuantity: t.Number(),
            sku: t.String(),
            imageUrl: t.String(),
            categoryId: t.String(),
            isActive: t.Boolean(),
        })),
        response: { 200: t.Any(), 400: t.Any() },
        detail: { summary: 'Update product by seller' }
    })
    .delete('/products/:id', async ({ user, params }) => {
        const userId = user!.sub as string;
        await sellerService.deleteProduct(userId, params.id);
        return successResponse(null, 'Product deleted successfully');
    }, {
        response: { 200: t.Any(), 400: t.Any() },
        detail: { summary: 'Delete product by seller' }
    })
    .get('/orders', async ({ user }) => {
        const userId = user!.sub as string;
        const orders = await sellerService.getSellerOrders(userId);
        return successResponse(orders, 'Seller orders retrieved successfully');
    }, {
        response: { 200: t.Any() },
        detail: { summary: 'Get orders for the current seller' }
    });

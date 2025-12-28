import {Elysia, t} from 'elysia';
import {SellerService} from '../service/SellerService';
import {errorResponse, paginatedResponse, successResponse} from '../../../core/responses';
import {authPlugin} from '../../../core/auth';

const sellerService = new SellerService();

export const sellerController = new Elysia({ prefix: '/seller', tags: ['Seller'] })
    .use(authPlugin)
    .guard({
        hasRole: 'seller'
    })
    .get('/products', async ({ user, query }) => {
        const userId = user!.sub as string;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const result = await sellerService.getSellerProducts(userId, page, limit);
        return paginatedResponse(result.products, { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }, 'Products retrieved successfully');
    })
    .post('/products', async ({ user, body, set }) => {
        try {
            const userId = user!.sub as string;
            const product = await sellerService.createProduct(userId, body);
            set.status = 201;
            return successResponse(product, 'Product created successfully', 201);
        } catch (error: any) {
            set.status = 400;
            return errorResponse(error.message, 'BAD_REQUEST', 400);
        }
    }, {
        body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
            price: t.Number(),
            stockQuantity: t.Number(),
            sku: t.String(),
            imageUrl: t.Optional(t.String()),
            categoryId: t.String(),
        })
    })
    .put('/products/:id', async ({ user, params, body, set }) => {
        try {
            const userId = user!.sub as string;
            const product = await sellerService.updateProduct(userId, params.id, body);
            return successResponse(product, 'Product updated successfully');
        } catch (error: any) {
            set.status = 400;
            return errorResponse(error.message, 'BAD_REQUEST', 400);
        }
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
        }))
    })
    .delete('/products/:id', async ({ user, params, set }) => {
        try {
            const userId = user!.sub as string;
            await sellerService.deleteProduct(userId, params.id);
            return successResponse(null, 'Product deleted successfully');
        } catch (error: any) {
            set.status = 400;
            return errorResponse(error.message, 'BAD_REQUEST', 400);
        }
    })
    .get('/orders', async ({ user }) => {
        const userId = user!.sub as string;
        const orders = await sellerService.getSellerOrders(userId);
        return successResponse(orders, 'Seller orders retrieved successfully');
    });

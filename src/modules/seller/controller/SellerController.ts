import { Elysia, t } from 'elysia';
import { SellerService } from '../service/SellerService';
import { errorResponse, paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
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
        const page = query.page || 1;
        const limit = query.limit || 10;
        const { items, total } = await sellerService.getSellerProducts(userId, page, limit);

        return paginatedResponse(items, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, 'Products retrieved successfully');
    }, {
        query: t.Object({
            page: t.Optional(t.Numeric()),
            limit: t.Optional(t.Numeric()),
        }),
        response: { 200: paginatedSchema() },
        detail: { summary: 'Get products for the current seller' }
    })
    .post('/products', async ({ user, body, set }) => {
        const userId = user!.sub as string;
        const product = await sellerService.createSellerProduct(userId, body);
        set.status = 201;
        return successResponse(product, 'Product created successfully', 201);
    }, {
        body: t.Object({
            name: t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
            price: t.Number({ minimum: 0 }),
            stockQuantity: t.Number({ minimum: 0 }),
            sku: t.String({ minLength: 1 }),
            imageUrl: t.Optional(t.String()),
            categoryId: t.String(),
        }),
        response: {
            201: successSchema(),
            400: errorSchema,
            422: errorSchema
        },
        detail: { summary: 'Create a new product by seller' }
    })
    .put('/products/:id', async ({ user, params, body }) => {
        const userId = user!.sub as string;
        const product = await sellerService.updateSellerProduct(userId, params.id, body);
        return successResponse(product, 'Product updated successfully');
    }, {
        params: t.Object({ id: t.String() }),
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
        response: {
            200: successSchema(),
            400: errorSchema,
            404: errorSchema
        },
        detail: { summary: 'Update product by seller' }
    })
    .delete('/products/:id', async ({ user, params }) => {
        const userId = user!.sub as string;
        await sellerService.deleteSellerProduct(userId, params.id);
        return successResponse(null, 'Product deleted successfully');
    }, {
        params: t.Object({ id: t.String() }),
        response: {
            200: successSchema(t.Null()),
            400: errorSchema,
            404: errorSchema
        },
        detail: { summary: 'Delete product by seller' }
    })
    .get('/orders', async ({ user }) => {
        const userId = user!.sub as string;
        const orders = await sellerService.getSellerOrders(userId);
        return successResponse(orders, 'Seller orders retrieved successfully');
    }, {
        response: {
            200: successSchema(t.Array(t.Any()))
        },
        detail: { summary: 'Get orders for the current seller' }
    });

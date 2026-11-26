import { Elysia, t } from 'elysia';
import { SellerService } from '../service/SellerService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const sellerService = new SellerService();

export const sellerController = new Elysia({ prefix: '/seller', tags: ['Seller'] })
    .use(authPlugin)
    .guard({
        hasRole: [UserRole.SELLER, UserRole.ADMIN]
    })
    .get('/products', {
        query: t.Object({
            page: t.Optional(t.Integer({ minimum: 1 })),
            limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        }),
        response: { 200: paginatedSchema() },
        detail: { summary: 'Get products for the current seller' }
    }, async ({ user, query }) => {
        const userId = user!.sub as string;
        const { page, limit } = getPagination(query);
        const { items, total } = await sellerService.getSellerProducts(userId, page, limit);
    
        return paginatedResponse(items, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, 'Products retrieved successfully');
    })
    .post('/products', {
        body: t.Object({
            name: t.String({ minLength: 1, maxLength: 255 }),
            description: t.Optional(t.String({ maxLength: 5000 })),
            price: t.Number({ minimum: 0 }),
            stockQuantity: t.Integer({ minimum: 0 }),
            weightGrams: t.Optional(t.Integer({ minimum: 0 })),
            sku: t.String({ minLength: 1, maxLength: 100 }),
            imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
            categoryId: t.Optional(t.String({ format: 'uuid' })),
            isActive: t.Optional(t.Boolean()),
        }),
        response: {
            201: successSchema(),
            400: errorSchema,
            409: errorSchema,
            422: errorSchema
        },
        detail: { summary: 'Create a new product by seller' }
    }, async ({ user, body, set }) => {
        const userId = user!.sub as string;
        const product = await sellerService.createSellerProduct(userId, body);
        set.status = 201;
        return successResponse(product, 'Product created successfully', 201);
    })
    .put('/products/:id', {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Partial(t.Object({
            name: t.String({ minLength: 1, maxLength: 255 }),
            description: t.String({ maxLength: 5000 }),
            price: t.Number({ minimum: 0 }),
            stockQuantity: t.Integer({ minimum: 0 }),
            weightGrams: t.Integer({ minimum: 0 }),
            sku: t.String({ minLength: 1, maxLength: 100 }),
            imageUrl: t.String({ format: 'uri', maxLength: 500 }),
            categoryId: t.String({ format: 'uuid' }),
            isActive: t.Boolean(),
        })),
        response: {
            200: successSchema(),
            400: errorSchema,
            404: errorSchema
        },
        detail: { summary: 'Update product by seller' }
    }, async ({ user, params, body }) => {
        const userId = user!.sub as string;
        const product = await sellerService.updateSellerProduct(userId, params.id, body);
        return successResponse(product, 'Product updated successfully');
    })
    .delete('/products/:id', {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        response: {
            200: successSchema(t.Null()),
            400: errorSchema,
            404: errorSchema
        },
        detail: { summary: 'Delete product by seller' }
    }, async ({ user, params }) => {
        const userId = user!.sub as string;
        await sellerService.deleteSellerProduct(userId, params.id);
        return successResponse(null, 'Product deleted successfully');
    })
    .get('/orders', {
        query: t.Object({
            page: t.Optional(t.Integer({ minimum: 1 })),
            limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        }),
        response: {
            200: paginatedSchema()
        },
        detail: { summary: 'Get orders containing the current seller products' }
    }, async ({ user, query }) => {
        const userId = user!.sub as string;
        const { page, limit } = getPagination(query);
        const { items, total } = await sellerService.getSellerOrders(userId, page, limit);
        return paginatedResponse(items, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }, 'Seller orders retrieved successfully');
    })
    .get('/stats', {
        response: { 200: successSchema() },
        detail: { summary: 'Get seller product and sales statistics' }
    }, async ({ user }) => {
        const stats = await sellerService.getSellerStats(user!.sub as string);
        return successResponse(stats, 'Seller statistics retrieved successfully');
    });

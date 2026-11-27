import { Elysia, t } from 'elysia';
import { ReviewService } from '../service/ReviewService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams, uuid } from '../../../core/schemas';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const reviewService = new ReviewService();

export const reviewController = new Elysia({ prefix: '/reviews', tags: ['Review'] })
    .use(authPlugin)

    .get('/product/:productId', {
        params: t.Object({ productId: uuid }),
        query: t.Object({
            page: t.Optional(t.Integer({ minimum: 1 })),
            limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        }),
        response: { 200: paginatedSchema() },
        detail: { summary: 'Get all approved reviews for a product' }
    }, async ({ params, query }) => {
        const { page, limit } = getPagination(query);
        const { items, total, averageRating } = await reviewService.getProductReviews(params.productId, page, limit);
    
        return paginatedResponse(
            items,
            {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            'Reviews retrieved successfully',
            200,
            { averageRating }
        );
    })

    .post('/', {
        body: t.Object({
            productId: uuid,
            rating: t.Integer({ minimum: 1, maximum: 5 }),
            title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
            comment: t.Optional(t.String({ minLength: 1, maxLength: 2000 })),
        }),
        isAuth: true,
        response: {
            201: successSchema(),
            400: errorSchema,
            409: errorSchema,
            422: errorSchema
        },
        detail: { summary: 'Create a product review' }
    }, async ({ body, set, user }) => {
        const review = await reviewService.createReview(user!.sub, body as any);
        set.status = 201;
        return successResponse(review, 'Review created successfully', 201);
    })

    .get('/my-reviews', {
        query: t.Object({
            page: t.Optional(t.Integer({ minimum: 1 })),
            limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        }),
        isAuth: true,
        response: { 200: paginatedSchema() },
        detail: { summary: 'Get current user reviews' }
    }, async ({ query, user }) => {
        const { page, limit } = getPagination(query);
        const { items, total } = await reviewService.getMyReviews(user!.sub, page, limit);
    
        return paginatedResponse(
            items,
            {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            'Your reviews retrieved successfully'
        );
    })

    .get('/pending', {
        query: t.Object({
            page: t.Optional(t.Integer({ minimum: 1 })),
            limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        }),
        hasRole: UserRole.ADMIN,
        response: { 200: paginatedSchema() },
        detail: { summary: 'Get pending reviews (Admin only)' }
    }, async ({ query }) => {
        const { page, limit } = getPagination(query);
        const { items, total } = await reviewService.getPendingReviews(page, limit);
        return paginatedResponse(items, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }, 'Pending reviews retrieved successfully');
    })

    .patch('/:id/approve', {
        params: idParams,
        body: t.Object({ isApproved: t.Boolean() }),
        hasRole: UserRole.ADMIN,
        response: { 200: successSchema(), 404: errorSchema },
        detail: { summary: 'Approve or reject a review (Admin only)' }
    }, async ({ params, body }) => {
        const review = await reviewService.approveReview(params.id, body.isApproved);
        return successResponse(review, body.isApproved ? 'Review approved' : 'Review rejected');
    })

    .put('/:id', {
        params: idParams,
        body: t.Partial(t.Object({
            rating: t.Integer({ minimum: 1, maximum: 5 }),
            title: t.String({ minLength: 1, maxLength: 200 }),
            comment: t.String({ minLength: 1, maxLength: 2000 }),
        })),
        isAuth: true,
        response: {
            200: successSchema(),
            400: errorSchema,
            403: errorSchema,
            404: errorSchema
        },
        detail: { summary: 'Update your review' }
    }, async ({ params, body, user }) => {
        const review = await reviewService.updateReview(params.id, user!.sub, body);
        return successResponse(review, 'Review updated successfully');
    })

    .delete('/:id', {
        params: idParams,
        isAuth: true,
        response: {
            200: successSchema(t.Null()),
            403: errorSchema,
            404: errorSchema
        },
        detail: { summary: 'Delete your review' }
    }, async ({ params, user }) => {
        const isAdmin = user!.role === UserRole.ADMIN;
        await reviewService.deleteReview(params.id, user!.sub, isAdmin);
        return successResponse(null, 'Review deleted successfully');
    })

    .post('/:id/helpful', {
        params: idParams,
        isAuth: true,
        response: {
            200: successSchema(),
            404: errorSchema
        },
        detail: { summary: 'Mark a review as helpful (once per user)' }
    }, async ({ params, user }) => {
        const review = await reviewService.markHelpful(params.id, user!.sub);
        return successResponse(review, 'Review marked as helpful');
    });

import { Elysia, t } from 'elysia';
import { ReviewService } from '../service/ReviewService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const reviewService = new ReviewService();

export const reviewController = new Elysia({ prefix: '/reviews', tags: ['Review'] })
    .use(authPlugin)

    .get(
        '/product/:productId',
        async ({ params, query }) => {
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
        },
        {
            params: t.Object({ productId: t.String({ format: 'uuid' }) }),
            query: t.Object({
                page: t.Optional(t.Integer({ minimum: 1 })),
                limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
            }),
            response: { 200: paginatedSchema() },
            detail: { summary: 'Get all approved reviews for a product' }
        }
    )

    .post(
        '/',
        async ({ body, set, user }) => {
            const review = await reviewService.createReview(user!.sub, body as any);
            set.status = 201;
            return successResponse(review, 'Review created successfully', 201);
        },
        {
            body: t.Object({
                productId: t.String({ format: 'uuid' }),
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
        }
    )

    .get(
        '/my-reviews',
        async ({ query, user }) => {
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
        },
        {
            query: t.Object({
                page: t.Optional(t.Integer({ minimum: 1 })),
                limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
            }),
            isAuth: true,
            response: { 200: paginatedSchema() },
            detail: { summary: 'Get current user reviews' }
        }
    )

    .get(
        '/pending',
        async ({ query }) => {
            const { page, limit } = getPagination(query);
            const { items, total } = await reviewService.getPendingReviews(page, limit);
            return paginatedResponse(items, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }, 'Pending reviews retrieved successfully');
        },
        {
            query: t.Object({
                page: t.Optional(t.Integer({ minimum: 1 })),
                limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
            }),
            hasRole: UserRole.ADMIN,
            response: { 200: paginatedSchema() },
            detail: { summary: 'Get pending reviews (Admin only)' }
        }
    )

    .patch(
        '/:id/approve',
        async ({ params, body }) => {
            const review = await reviewService.approveReview(params.id, body.isApproved);
            return successResponse(review, body.isApproved ? 'Review approved' : 'Review rejected');
        },
        {
            params: t.Object({ id: t.String({ format: 'uuid' }) }),
            body: t.Object({ isApproved: t.Boolean() }),
            hasRole: UserRole.ADMIN,
            response: { 200: successSchema(), 404: errorSchema },
            detail: { summary: 'Approve or reject a review (Admin only)' }
        }
    )

    .put(
        '/:id',
        async ({ params, body, user }) => {
            const review = await reviewService.updateReview(params.id, user!.sub, body);
            return successResponse(review, 'Review updated successfully');
        },
        {
            params: t.Object({ id: t.String({ format: 'uuid' }) }),
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
        }
    )

    .delete(
        '/:id',
        async ({ params, user }) => {
            const isAdmin = user!.role === UserRole.ADMIN;
            await reviewService.deleteReview(params.id, user!.sub, isAdmin);
            return successResponse(null, 'Review deleted successfully');
        },
        {
            params: t.Object({ id: t.String({ format: 'uuid' }) }),
            isAuth: true,
            response: {
                200: successSchema(t.Null()),
                403: errorSchema,
                404: errorSchema
            },
            detail: { summary: 'Delete your review' }
        }
    )

    .post(
        '/:id/helpful',
        async ({ params, user }) => {
            const review = await reviewService.markHelpful(params.id, user!.sub);
            return successResponse(review, 'Review marked as helpful');
        },
        {
            params: t.Object({ id: t.String({ format: 'uuid' }) }),
            isAuth: true,
            response: {
                200: successSchema(),
                404: errorSchema
            },
            detail: { summary: 'Mark a review as helpful (once per user)' }
        }
    );

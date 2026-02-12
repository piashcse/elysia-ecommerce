import { Elysia, t } from 'elysia';
import { ReviewService } from '../service/ReviewService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { eq } from 'drizzle-orm';

const reviewService = new ReviewService();

export const reviewController = new Elysia({ prefix: '/reviews', tags: ['Review'] })
    .use(authPlugin)

    // Get reviews for a product (public)
    .get(
        '/product/:productId',
        async ({ params, query }) => {
            const page = query.page || 1;
            const limit = query.limit || 10;

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
            params: t.Object({ productId: t.String() }),
            query: t.Object({
                page: t.Optional(t.Numeric()),
                limit: t.Optional(t.Numeric()),
            }),
            response: { 200: paginatedSchema() },
            detail: { summary: 'Get all reviews for a product' }
        }
    )

    // Create a review (authenticated)
    .post(
        '/',
        async ({ body, set, user }) => {
            const review = await reviewService.createReview(user!.sub, body);
            set.status = 201;
            return successResponse(review, 'Review created successfully', 201);
        },
        {
            body: t.Object({
                productId: t.String(),
                rating: t.Number({ minimum: 1, maximum: 5 }),
                title: t.Optional(t.String()),
                comment: t.Optional(t.String()),
            }),
            isAuth: true,
            response: {
                201: successSchema(),
                400: errorSchema,
                422: errorSchema
            },
            detail: { summary: 'Create a product review' }
        }
    )

    // Get user's reviews (authenticated)
    .get(
        '/my-reviews',
        async ({ query, user }) => {
            const page = query.page || 1;
            const limit = query.limit || 10;

            const { items, total } = await reviewService.findAll(page, limit, [eq((reviewService as any).schema.userId, user!.sub)]);

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
                page: t.Optional(t.Numeric()),
                limit: t.Optional(t.Numeric()),
            }),
            isAuth: true,
            response: { 200: paginatedSchema() },
            detail: { summary: 'Get current user reviews' }
        }
    )

    // Update a review (authenticated)
    .put(
        '/:id',
        async ({ params, body, user }) => {
            const review = await reviewService.updateReview(params.id, user!.sub, body);
            return successResponse(review, 'Review updated successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Partial(t.Object({
                rating: t.Number({ minimum: 1, maximum: 5 }),
                title: t.String(),
                comment: t.String(),
            })),
            isAuth: true,
            response: {
                200: successSchema(),
                400: errorSchema,
                404: errorSchema
            },
            detail: { summary: 'Update your review' }
        }
    )

    // Delete a review (authenticated)
    .delete(
        '/:id',
        async ({ params, user }) => {
            const isAdmin = user!.role === UserRole.ADMIN;
            await reviewService.deleteReview(params.id, user!.sub, isAdmin);
            return successResponse(null, 'Review deleted successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            isAuth: true,
            response: {
                200: successSchema(t.Null()),
                403: errorSchema,
                404: errorSchema
            },
            detail: { summary: 'Delete your review' }
        }
    )

    // Mark review as helpful (public)
    .post(
        '/:id/helpful',
        async ({ params }) => {
            const review = await reviewService.markHelpful(params.id);
            return successResponse(review, 'Review marked as helpful');
        },
        {
            params: t.Object({ id: t.String() }),
            response: {
                200: successSchema(),
                404: errorSchema
            },
            detail: { summary: 'Mark review as helpful' }
        }
    );

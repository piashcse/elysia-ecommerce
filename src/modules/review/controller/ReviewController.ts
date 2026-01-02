import { Elysia, t } from 'elysia';
import { ReviewService } from '../service/ReviewService';
import { createReviewSchema, reviewIdSchema, updateReviewSchema } from '../validators/ReviewValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const reviewService = new ReviewService();

export const reviewController = new Elysia({ prefix: '/reviews', tags: ['Review'] })
    .use(authPlugin)

    // Get reviews for a product (public)
    .get(
        '/product/:productId',
        async ({ params, query }) => {
            const { productId } = params;
            const page = parseInt(query.page as string) || 1;
            const limit = parseInt(query.limit as string) || 10;

            const result = await reviewService.getProductReviews(productId, page, limit);

            return paginatedResponse(
                result.reviews,
                {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit),
                },
                'Reviews retrieved successfully',
                200,
                { averageRating: result.averageRating }
            );
        },
        {
            params: t.Object({ productId: t.String() }),
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            }),
            response: { 200: t.Any() },
            detail: { summary: 'Get all reviews for a product' }
        }
    )

    // Create a review (authenticated)
    .post(
        '/',
        async ({ body, set, user }) => {
            const validatedData = validate(createReviewSchema, body);
            const review = await reviewService.createReview(user!.sub, validatedData);

            set.status = 201;
            return successResponse(review, 'Review created successfully', 201);
        },
        {
            body: t.Object({
                productId: t.String(),
                rating: t.Number(),
                title: t.Optional(t.String()),
                comment: t.Optional(t.String()),
            }),
            isAuth: true,
            response: { 201: t.Any(), 400: t.Any(), 422: t.Any() },
            detail: { summary: 'Create a product review' }
        }
    )

    // Get user's reviews (authenticated)
    .get(
        '/my-reviews',
        async ({ query, user }) => {
            const page = parseInt(query.page as string) || 1;
            const limit = parseInt(query.limit as string) || 10;

            const result = await reviewService.getUserReviews(user!.sub, page, limit);

            return paginatedResponse(
                result.reviews,
                {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit),
                },
                'Your reviews retrieved successfully'
            );
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            }),
            isAuth: true,
            response: { 200: t.Any() },
            detail: { summary: 'Get current user reviews' }
        }
    )

    // Update a review (authenticated)
    .put(
        '/:id',
        async ({ params, body, user }) => {
            const { id } = params;
            validate(reviewIdSchema, { id });
            const validatedData = validate(updateReviewSchema, body);

            const review = await reviewService.updateReview(id, user!.sub, validatedData);

            return successResponse(review, 'Review updated successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                rating: t.Optional(t.Number()),
                title: t.Optional(t.String()),
                comment: t.Optional(t.String()),
            }),
            isAuth: true,
            response: { 200: t.Any(), 400: t.Any(), 404: t.Any() },
            detail: { summary: 'Update your review' }
        }
    )

    // Delete a review (authenticated)
    .delete(
        '/:id',
        async ({ params, user }) => {
            const { id } = params;
            validate(reviewIdSchema, { id });

            const isAdmin = user!.role === 'admin';
            await reviewService.deleteReview(id, user!.sub, isAdmin);

            return successResponse(null, 'Review deleted successfully');
        },
        {
            params: t.Object({ id: t.String() }),
            isAuth: true,
            response: { 200: t.Any(), 403: t.Any(), 404: t.Any() },
            detail: { summary: 'Delete your review' }
        }
    )

    // Mark review as helpful (public)
    .post(
        '/:id/helpful',
        async ({ params }) => {
            const { id } = params;
            validate(reviewIdSchema, { id });

            const review = await reviewService.markHelpful(id);

            return successResponse(review, 'Review marked as helpful');
        },
        {
            params: t.Object({ id: t.String() }),
            response: { 200: t.Any(), 404: t.Any() },
            detail: { summary: 'Mark review as helpful' }
        }
    );

import { Elysia, t } from 'elysia';
import { ReviewService } from '../service/ReviewService';
import { createReviewSchema, updateReviewSchema, reviewIdSchema } from '../validators/ReviewValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { jwt } from '@elysiajs/jwt';
import envConfig from '../../../config/env';
import { JwtPayload } from '../../../utils/jwt';

const reviewService = new ReviewService();

export const reviewController = new Elysia({ prefix: '/reviews', tags: ['Review'] })
    .use(jwt({ name: 'jwt', secret: envConfig.JWT_SECRET }))
    .derive(async ({ jwt, headers }) => {
        const authHeader = headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { user: null };
        }
        const token = authHeader.split(' ')[1];
        const payload = await jwt.verify(token);
        if (!payload) return { user: null };
        return { user: payload as unknown as JwtPayload };
    })

    // Get reviews for a product (public)
    .get(
        '/product/:productId',
        async ({ params, query, set }) => {
            try {
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
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ productId: t.String() }),
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            }),
            detail: { summary: 'Get all reviews for a product' }
        }
    )

    // Create a review (authenticated)
    .post(
        '/',
        async ({ body, set, user }) => {
            try {
                if (!user) {
                    set.status = 401;
                    return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
                }

                const validatedData = validate(createReviewSchema, body);
                const review = await reviewService.createReview(user.sub, validatedData);

                set.status = 201;
                return successResponse(review, 'Review created successfully', 201);
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            body: t.Object({
                productId: t.String(),
                rating: t.Number(),
                title: t.Optional(t.String()),
                comment: t.Optional(t.String()),
            }),
            detail: { summary: 'Create a product review' }
        }
    )

    // Get user's reviews (authenticated)
    .get(
        '/my-reviews',
        async ({ query, set, user }) => {
            try {
                if (!user) {
                    set.status = 401;
                    return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
                }

                const page = parseInt(query.page as string) || 1;
                const limit = parseInt(query.limit as string) || 10;

                const result = await reviewService.getUserReviews(user.sub, page, limit);

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
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            }),
            detail: { summary: 'Get current user reviews' }
        }
    )

    // Update a review (authenticated)
    .put(
        '/:id',
        async ({ params, body, set, user }) => {
            try {
                if (!user) {
                    set.status = 401;
                    return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
                }

                const { id } = params;
                validate(reviewIdSchema, { id });
                const validatedData = validate(updateReviewSchema, body);

                const review = await reviewService.updateReview(id, user.sub, validatedData);

                return successResponse(review, 'Review updated successfully');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                rating: t.Optional(t.Number()),
                title: t.Optional(t.String()),
                comment: t.Optional(t.String()),
            }),
            detail: { summary: 'Update your review' }
        }
    )

    // Delete a review (authenticated)
    .delete(
        '/:id',
        async ({ params, set, user }) => {
            try {
                if (!user) {
                    set.status = 401;
                    return errorResponse('Authentication required', 'UNAUTHORIZED', 401);
                }

                const { id } = params;
                validate(reviewIdSchema, { id });

                const isAdmin = user.role === 'admin';
                await reviewService.deleteReview(id, user.sub, isAdmin);

                return successResponse(null, 'Review deleted successfully');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { summary: 'Delete your review' }
        }
    )

    // Mark review as helpful (public)
    .post(
        '/:id/helpful',
        async ({ params, set }) => {
            try {
                const { id } = params;
                validate(reviewIdSchema, { id });

                const review = await reviewService.markHelpful(id);

                return successResponse(review, 'Review marked as helpful');
            } catch (error: any) {
                set.status = error.statusCode || 500;
                return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
            }
        },
        {
            params: t.Object({ id: t.String() }),
            detail: { summary: 'Mark review as helpful' }
        }
    );

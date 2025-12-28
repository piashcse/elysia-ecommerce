import {db} from '../../../config/database';
import {orderItems, orders, products, reviews, users} from '../../../database/schema';
import {and, desc, eq, sql} from 'drizzle-orm';
import {CreateReviewDto, UpdateReviewDto} from '../dto/ReviewDto';
import {ConflictError, NotFoundError} from '../../../core/errors';

export class ReviewService {
    async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<any> {
        // Check if product exists
        const [product] = await db.select().from(products).where(eq(products.id, createReviewDto.productId)).limit(1);
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        // Check if user already reviewed this product
        const existingReview = await db
            .select()
            .from(reviews)
            .where(and(
                eq(reviews.productId, createReviewDto.productId),
                eq(reviews.userId, userId)
            ))
            .limit(1);

        if (existingReview.length > 0) {
            throw new ConflictError('You have already reviewed this product');
        }

        // Check if user purchased this product (verified purchase)
        const purchaseCheck = await db
            .select()
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(
                eq(orders.userId, userId),
                eq(orderItems.productId, createReviewDto.productId),
                eq(orders.status, 'delivered')
            ))
            .limit(1);

        const isVerifiedPurchase = purchaseCheck.length > 0;

        const [newReview] = await db.insert(reviews).values({
            userId,
            productId: createReviewDto.productId,
            rating: createReviewDto.rating,
            title: createReviewDto.title,
            comment: createReviewDto.comment,
            isVerifiedPurchase,
            isApproved: true, // Auto-approve for now, can add moderation later
        }).returning();

        return newReview;
    }

    async getReviewById(reviewId: string): Promise<any | null> {
        const [review] = await db
            .select({
                review: reviews,
                user: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                }
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .where(eq(reviews.id, reviewId))
            .limit(1);

        return review || null;
    }

    async getProductReviews(
        productId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ reviews: any[]; total: number; averageRating: number }> {
        const offset = (page - 1) * limit;

        // Get reviews
        const reviewsResult = await db
            .select({
                review: reviews,
                user: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                }
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .where(and(
                eq(reviews.productId, productId),
                eq(reviews.isApproved, true)
            ))
            .orderBy(desc(reviews.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count
        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(reviews)
            .where(and(
                eq(reviews.productId, productId),
                eq(reviews.isApproved, true)
            ));

        // Calculate average rating
        const [avgResult] = await db
            .select({ avg: sql<number>`avg(${reviews.rating})` })
            .from(reviews)
            .where(and(
                eq(reviews.productId, productId),
                eq(reviews.isApproved, true)
            ));

        const total = countResult ? Number(countResult.count) : 0;
        const averageRating = avgResult?.avg ? Number(avgResult.avg) : 0;

        return {
            reviews: reviewsResult.map(r => ({ ...r.review, user: r.user })),
            total,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        };
    }

    async updateReview(reviewId: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<any> {
        const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);

        if (!review) {
            throw new NotFoundError('Review not found');
        }

        if (review.userId !== userId) {
            throw new Error('You can only update your own reviews');
        }

        const [updatedReview] = await db
            .update(reviews)
            .set(updateReviewDto as any)
            .where(eq(reviews.id, reviewId))
            .returning();

        return updatedReview;
    }

    async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false): Promise<void> {
        const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);

        if (!review) {
            throw new NotFoundError('Review not found');
        }

        if (!isAdmin && review.userId !== userId) {
            throw new Error('You can only delete your own reviews');
        }

        await db.delete(reviews).where(eq(reviews.id, reviewId));
    }

    async markHelpful(reviewId: string): Promise<any> {
        const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);

        if (!review) {
            throw new NotFoundError('Review not found');
        }

        const [updatedReview] = await db
            .update(reviews)
            .set({ helpfulCount: review.helpfulCount + 1 })
            .where(eq(reviews.id, reviewId))
            .returning();

        return updatedReview;
    }

    async getUserReviews(userId: string, page: number = 1, limit: number = 10): Promise<{ reviews: any[]; total: number }> {
        const offset = (page - 1) * limit;

        const reviewsResult = await db
            .select({
                review: reviews,
                product: {
                    id: products.id,
                    name: products.name,
                    imageUrl: products.imageUrl,
                }
            })
            .from(reviews)
            .leftJoin(products, eq(reviews.productId, products.id))
            .where(eq(reviews.userId, userId))
            .orderBy(desc(reviews.createdAt))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(reviews)
            .where(eq(reviews.userId, userId));

        const total = countResult ? Number(countResult.count) : 0;

        return {
            reviews: reviewsResult.map(r => ({ ...r.review, product: r.product })),
            total,
        };
    }
}

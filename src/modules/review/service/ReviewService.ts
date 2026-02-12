import { db } from '../../../config/database';
import { orderItems, orders, products, reviews, users } from '../../../database/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { CreateReviewDto, UpdateReviewDto } from '../dto/ReviewDto';
import { ConflictError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class ReviewService extends BaseService<typeof reviews> {
    constructor() {
        super(reviews);
    }

    async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<any> {
        const [product] = await db.select().from(products).where(eq(products.id, createReviewDto.productId)).limit(1);
        if (!product) throw new NotFoundError('Product not found');

        const [existingReview] = await db
            .select()
            .from(reviews)
            .where(and(eq(reviews.productId, createReviewDto.productId), eq(reviews.userId, userId)))
            .limit(1);

        if (existingReview) throw new ConflictError('You have already reviewed this product');

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

        return this.create({
            ...createReviewDto,
            userId,
            isVerifiedPurchase: purchaseCheck.length > 0,
            isApproved: true,
        });
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
    ): Promise<{ items: any[]; total: number; averageRating: number }> {
        const conditions = [
            eq(reviews.productId, productId),
            eq(reviews.isApproved, true)
        ];

        const { items, total } = await this.findAll(page, limit, conditions);

        const [avgResult] = await db
            .select({ avg: sql<number>`avg(${reviews.rating})` })
            .from(reviews)
            .where(and(...conditions));

        const averageRating = avgResult?.avg ? Number(avgResult.avg) : 0;

        return {
            items,
            total,
            averageRating: Math.round(averageRating * 10) / 10,
        };
    }

    async updateReview(reviewId: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<any> {
        const review = await this.findByIdOrFail(reviewId, 'Review');
        if (review.userId !== userId) throw new Error('You can only update your own reviews');

        return this.update(reviewId, updateReviewDto);
    }

    async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false): Promise<void> {
        const review = await this.findByIdOrFail(reviewId, 'Review');
        if (!isAdmin && review.userId !== userId) throw new Error('You can only delete your own reviews');

        return this.delete(reviewId);
    }

    async markHelpful(reviewId: string): Promise<any> {
        const review = await this.findByIdOrFail(reviewId, 'Review');
        return this.update(reviewId, { helpfulCount: (review.helpfulCount || 0) + 1 });
    }
}

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orderItems, orders, products, reviewHelpful, reviews, users } from '../../../database/schema';
import { CreateReviewDto, UpdateReviewDto } from '../dto/ReviewDto';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';
import envConfig from '../../../config/env';

export class ReviewService extends BaseService<typeof reviews> {
  constructor() {
    super(reviews);
  }

  async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<any> {
    const [product] = await db
      .select({ id: products.id, isActive: products.isActive })
      .from(products)
      .where(eq(products.id, createReviewDto.productId))
      .limit(1);

    if (!product) throw new NotFoundError('Product not found');
    if (!product.isActive) throw new ConflictError('Product is not available', 'PRODUCT_INACTIVE');

    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, createReviewDto.productId), eq(reviews.userId, userId)))
      .limit(1);

    if (existingReview) throw new ConflictError('You have already reviewed this product', 'REVIEW_ALREADY_EXISTS');

    const purchaseCheck = await db
      .select({ id: orderItems.id })
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
      isApproved: envConfig.REVIEW_AUTO_APPROVE,
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
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<{ items: any[]; total: number; averageRating: number }> {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
    const safeLimit = Number.isFinite(limit) ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit))) : PAGINATION.DEFAULT_LIMIT;
    const offset = (safePage - 1) * safeLimit;
    const conditions = [eq(reviews.productId, productId), eq(reviews.isApproved, true)];

    const items = await db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        userId: reviews.userId,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        helpfulCount: reviews.helpfulCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(reviews.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const [aggregate] = await db
      .select({
        total: sql<number>`count(*)`,
        avg: sql<number>`avg(${reviews.rating})`,
      })
      .from(reviews)
      .where(and(...conditions));

    const total = aggregate ? Number(aggregate.total) : 0;
    const averageRating = aggregate?.avg ? Number(aggregate.avg) : 0;

    return {
      items,
      total,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  async getMyReviews(userId: string, page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
    return this.findAll(page, limit, [eq(reviews.userId, userId)]);
  }

  async getPendingReviews(page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
    return this.findAll(page, limit, [eq(reviews.isApproved, false)]);
  }

  async approveReview(reviewId: string, isApproved: boolean): Promise<any> {
    await this.findByIdOrFail(reviewId, 'Review');
    return this.update(reviewId, { isApproved });
  }

  async updateReview(reviewId: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<any> {
    const review = await this.findByIdOrFail(reviewId, 'Review');
    if (review.userId !== userId) throw new ForbiddenError('You can only update your own reviews');

    return this.update(reviewId, {
      ...updateReviewDto,
      isApproved: envConfig.REVIEW_AUTO_APPROVE,
    });
  }

  async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const review = await this.findByIdOrFail(reviewId, 'Review');
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    return this.delete(reviewId);
  }

  async markHelpful(reviewId: string, userId: string): Promise<any> {
    const review = await this.findByIdOrFail(reviewId, 'Review');

    return db.transaction(async (tx) => {
      const inserted = await tx
        .insert(reviewHelpful)
        .values({ reviewId, userId })
        .onConflictDoNothing()
        .returning({ id: reviewHelpful.id });

      if (!inserted.length) {
        return review;
      }

      const [updated] = await tx
        .update(reviews)
        .set({ helpfulCount: sql`${reviews.helpfulCount} + 1`, updatedAt: new Date() })
        .where(eq(reviews.id, reviewId))
        .returning();

      return updated;
    });
  }
}

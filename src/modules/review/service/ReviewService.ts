import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orderItems, orders, products, reviewHelpful, reviewImages, reviews, users } from '../../../database/schema';
import { CreateReviewDto, UpdateReviewDto } from '../dto/ReviewDto';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';
import envConfig from '../../../config/env';

export class ReviewService extends BaseService {
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

    const review = await this.create({
      ...createReviewDto,
      userId,
      isVerifiedPurchase: purchaseCheck.length > 0,
      isApproved: envConfig.REVIEW_AUTO_APPROVE,
    });

    if (createReviewDto.images?.length && review) {
      await db.insert(reviewImages).values(
        createReviewDto.images.slice(0, 5).map((imageUrl) => ({ reviewId: review.id, imageUrl }))
      );
    }

    return review;
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

    const [items, [aggregate]] = await Promise.all([
      db
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
        .offset(offset),
      db
        .select({
          total: sql<number>`count(*)`,
          avg: sql<number>`avg(${reviews.rating})`,
        })
        .from(reviews)
        .where(and(...conditions)),
    ]);

    const imageRows = items.length
      ? await db.select().from(reviewImages).where(inArray(reviewImages.reviewId, items.map((item) => item.id)))
      : [];

    const total = aggregate ? Number(aggregate.total) : 0;
    const averageRating = aggregate?.avg ? Number(aggregate.avg) : 0;

    return {
      items: items.map((item) => ({
        ...item,
        images: imageRows.filter((image) => image.reviewId === item.id).map((image) => image.imageUrl),
      })),
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
    const [review] = await db
      .update(reviews)
      .set({ isApproved, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning();
    if (!review) throw new NotFoundError('Review not found');
    return review;
  }

  async updateReview(reviewId: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<any> {
    const review = await this.findByIdOrFail(reviewId, 'Review');
    if (review.userId !== userId) throw new ForbiddenError('You can only update your own reviews');

    const [updated] = await db
      .update(reviews)
      .set({
        ...updateReviewDto,
        isApproved: envConfig.REVIEW_AUTO_APPROVE,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    if (!updated) throw new NotFoundError('Review not found');
    return updated;
  }

  async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const review = await this.findByIdOrFail(reviewId, 'Review');
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    await db.delete(reviews).where(eq(reviews.id, reviewId));
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

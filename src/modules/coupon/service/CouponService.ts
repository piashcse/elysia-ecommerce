import { and, eq, gte, ilike, lte, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { couponCategories, couponProducts, couponUsage, coupons } from '../../../database/schema';
import { CreateCouponDto, UpdateCouponDto } from '../dto/CouponDto';
import { BaseService } from '../../../core/base.service';
import { ConflictError, NotFoundError, ValidationError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';

const toCents = (value: number | string): number => Math.round(Number(value) * 100);
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

export interface CouponValidation {
  coupon: any;
  discountCents: number;
  discountAmount: string;
}

export class CouponService extends BaseService {
  constructor() {
    super(coupons);
  }

  private validateRules(data: {
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    startDate: Date;
    endDate: Date;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perUserLimit?: number;
  }) {
    if (Number.isNaN(data.startDate.getTime()) || Number.isNaN(data.endDate.getTime())) {
      throw new ValidationError('Coupon start and end dates must be valid dates');
    }
    if (data.startDate >= data.endDate) {
      throw new ValidationError('Coupon start date must be before the end date');
    }
    if (data.discountType === 'percentage' && (data.discountValue <= 0 || data.discountValue > 100)) {
      throw new ValidationError('Percentage discount must be greater than 0 and at most 100');
    }
    if (data.discountType === 'fixed' && data.discountValue <= 0) {
      throw new ValidationError('Fixed discount must be greater than 0');
    }
    if (data.minOrderAmount !== undefined && data.minOrderAmount < 0) {
      throw new ValidationError('Minimum order amount cannot be negative');
    }
    if (data.maxDiscountAmount !== undefined && data.maxDiscountAmount < 0) {
      throw new ValidationError('Maximum discount amount cannot be negative');
    }
    if (data.usageLimit !== undefined && data.usageLimit < 1) {
      throw new ValidationError('Usage limit must be at least 1');
    }
    if (data.perUserLimit !== undefined && data.perUserLimit < 1) {
      throw new ValidationError('Per-user limit must be at least 1');
    }
  }

  async createCoupon(createCouponDto: CreateCouponDto): Promise<any> {
    this.validateRules(createCouponDto);

    const code = createCouponDto.code.trim().toUpperCase();
    const [existing] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
    if (existing) throw new ConflictError('Coupon with this code already exists', 'COUPON_CODE_EXISTS');

    return this.create({
      ...createCouponDto,
      code,
      discountValue: createCouponDto.discountValue.toString(),
      minOrderAmount: createCouponDto.minOrderAmount?.toString(),
      maxDiscountAmount: createCouponDto.maxDiscountAmount?.toString(),
    });
  }

  async updateCoupon(id: string, updateCouponDto: UpdateCouponDto): Promise<any> {
    const current = await this.findByIdOrFail(id, 'Coupon');

    const merged = {
      discountType: updateCouponDto.discountType ?? current.discountType,
      discountValue: updateCouponDto.discountValue ?? Number(current.discountValue),
      startDate: updateCouponDto.startDate ?? current.startDate,
      endDate: updateCouponDto.endDate ?? current.endDate,
      minOrderAmount: updateCouponDto.minOrderAmount ?? (current.minOrderAmount === null ? undefined : Number(current.minOrderAmount)),
      maxDiscountAmount: updateCouponDto.maxDiscountAmount ?? (current.maxDiscountAmount === null ? undefined : Number(current.maxDiscountAmount)),
      usageLimit: updateCouponDto.usageLimit ?? (current.usageLimit ?? undefined),
      perUserLimit: updateCouponDto.perUserLimit ?? (current.perUserLimit ?? undefined),
    };

    this.validateRules(merged);

    const updateData: any = { ...updateCouponDto };
    if (updateCouponDto.code) updateData.code = updateCouponDto.code.trim().toUpperCase();
    if (updateCouponDto.discountValue !== undefined) updateData.discountValue = updateCouponDto.discountValue.toString();
    if (updateCouponDto.minOrderAmount !== undefined) updateData.minOrderAmount = updateCouponDto.minOrderAmount.toString();
    if (updateCouponDto.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = updateCouponDto.maxDiscountAmount.toString();

    if (updateData.code && updateData.code !== current.code) {
      const [existing] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, updateData.code)).limit(1);
      if (existing) throw new ConflictError('Coupon with this code already exists', 'COUPON_CODE_EXISTS');
    }

    const [updated] = await db
      .update(coupons)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();

    return updated;
  }

  async deleteCoupon(id: string): Promise<void> {
    const deleted = await db.delete(coupons).where(eq(coupons.id, id)).returning({ id: coupons.id });
    if (!deleted.length) throw new NotFoundError('Coupon not found');
  }

  async getRestrictions(couponId: string) {
    const [products, categories] = await Promise.all([
      db.select({ id: couponProducts.productId }).from(couponProducts).where(eq(couponProducts.couponId, couponId)),
      db.select({ id: couponCategories.categoryId }).from(couponCategories).where(eq(couponCategories.couponId, couponId)),
    ]);
    return {
      productIds: products.map((item) => item.id),
      categoryIds: categories.map((item) => item.id),
    };
  }

  async setRestrictions(couponId: string, input: { productIds?: string[]; categoryIds?: string[] }) {
    await this.findByIdOrFail(couponId, 'Coupon');
    await db.transaction(async (tx) => {
      await tx.delete(couponProducts).where(eq(couponProducts.couponId, couponId));
      await tx.delete(couponCategories).where(eq(couponCategories.couponId, couponId));
      if (input.productIds?.length) {
        await tx.insert(couponProducts).values(input.productIds.map((productId) => ({ couponId, productId })));
      }
      if (input.categoryIds?.length) {
        await tx.insert(couponCategories).values(input.categoryIds.map((categoryId) => ({ couponId, categoryId })));
      }
    });
    return this.getRestrictions(couponId);
  }

  async getCouponById(id: string): Promise<any> {
    return this.findByIdOrFail(id, 'Coupon');
  }

  async getCouponByCode(code: string, activeOnly = false): Promise<any | null> {
    const conditions = [eq(coupons.code, code.trim().toUpperCase())];
    if (activeOnly) {
      const now = new Date();
      conditions.push(eq(coupons.isActive, true), lte(coupons.startDate, now), gte(coupons.endDate, now));
    }

    const [coupon] = await db.select().from(coupons).where(and(...conditions)).limit(1);
    return coupon || null;
  }

  async getCoupons(page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT, filters: { code?: string; isActive?: boolean } = {}) {
    const conditions = [];
    if (filters.code) conditions.push(ilike(coupons.code, `%${filters.code}%`));
    if (filters.isActive !== undefined) conditions.push(eq(coupons.isActive, filters.isActive));
    return this.findAll(page, limit, conditions);
  }

  async validateCoupon(code: string, orderAmount: number, userId: string, context: { productIds?: string[]; categoryIds?: string[]; shippingCents?: number } = {}): Promise<CouponValidation> {
    const coupon = await this.getCouponByCode(code, true);

    if (!coupon) {
      throw new ValidationError('Coupon is invalid or expired', 'INVALID_COUPON');
    }

    const orderCents = toCents(orderAmount);
    if (orderCents <= 0) throw new ValidationError('Order amount must be greater than zero');

    if (coupon.minOrderAmount !== null && orderCents < toCents(coupon.minOrderAmount)) {
      throw new ValidationError(`Order does not meet the minimum amount of ${coupon.minOrderAmount}`, 'COUPON_MIN_ORDER');
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ValidationError('Coupon usage limit has been reached', 'COUPON_USAGE_LIMIT');
    }

    const restrictions = await this.getRestrictions(coupon.id);
    if (restrictions.productIds.length || restrictions.categoryIds.length) {
      const matchesProduct = (context.productIds ?? []).some((id) => restrictions.productIds.includes(id));
      const matchesCategory = (context.categoryIds ?? []).some((id) => restrictions.categoryIds.includes(id));
      if (!matchesProduct && !matchesCategory) {
        throw new ValidationError('Coupon is not applicable to the selected items', 'COUPON_NOT_APPLICABLE');
      }
    }

    if (coupon.perUserLimit !== null) {
      const [usage] = await db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, userId)));
      const usedByUser = usage ? Number(usage.count) : 0;
      if (usedByUser >= coupon.perUserLimit) {
        throw new ValidationError('You have already used this coupon', 'COUPON_USER_LIMIT');
      }
    }

    // Coupons that apply to shipping may discount the shipping cost as well.
    const discountableCents = orderCents + (coupon.appliesToShipping ? Math.max(0, context.shippingCents ?? 0) : 0);
    let discountCents = coupon.discountType === 'percentage'
      ? Math.round((discountableCents * Number(coupon.discountValue)) / 100)
      : toCents(coupon.discountValue);

    if (coupon.maxDiscountAmount !== null) {
      discountCents = Math.min(discountCents, toCents(coupon.maxDiscountAmount));
    }

    discountCents = Math.min(discountCents, discountableCents);

    return {
      coupon,
      discountCents,
      discountAmount: fromCents(discountCents),
    };
  }

  /**
   * Atomically increments the coupon usage counter and records the usage row.
   * Must be called inside the order transaction.
   */
  async recordUsage(tx: any, couponId: string, userId: string, orderId: string): Promise<void> {
    // Lock the coupon row so concurrent checkouts cannot exceed the global or
    // per-user limits.
    const [coupon] = await tx
      .select()
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1)
      .for('update');

    if (!coupon) throw new NotFoundError('Coupon not found');

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ConflictError('Coupon usage limit has been reached', 'COUPON_USAGE_LIMIT');
    }

    if (coupon.perUserLimit !== null) {
      const [usage] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(and(eq(couponUsage.couponId, couponId), eq(couponUsage.userId, userId)));
      if (usage && Number(usage.count) >= coupon.perUserLimit) {
        throw new ConflictError('You have already used this coupon', 'COUPON_USER_LIMIT');
      }
    }

    await tx
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
      .where(eq(coupons.id, couponId));

    await tx.insert(couponUsage).values({ couponId, userId, orderId });
  }

  /**
   * Releases a coupon when an order is cancelled or fully refunded so the
   * customer can use it again. Safe to call even if no usage was recorded.
   */
  async releaseUsage(tx: any, orderId: string): Promise<void> {
    const usages = await tx
      .select()
      .from(couponUsage)
      .where(eq(couponUsage.orderId, orderId));

    for (const usage of usages) {
      await tx.delete(couponUsage).where(eq(couponUsage.id, usage.id));
      await tx
        .update(coupons)
        .set({
          usedCount: sql`greatest(${coupons.usedCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, usage.couponId));
    }
  }
}

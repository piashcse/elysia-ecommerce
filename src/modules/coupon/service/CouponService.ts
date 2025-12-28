import {db} from '../../../config/database';
import {coupons} from '../../../database/schema';
import {desc, eq, sql} from 'drizzle-orm';
import {CreateCouponDto, UpdateCouponDto} from '../dto/CouponDto';
import {NotFoundError} from '../../../core/errors';

export class CouponService {
  async createCoupon(createCouponDto: CreateCouponDto): Promise<any> {
    const [newCoupon] = await db.insert(coupons).values({
      ...createCouponDto,
      discountValue: createCouponDto.discountValue.toString(),
      minOrderAmount: createCouponDto.minOrderAmount?.toString(),
      maxDiscountAmount: createCouponDto.maxDiscountAmount?.toString(),
    }).returning();

    return newCoupon;
  }

  async findCouponById(id: string): Promise<any | null> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return coupon || null;
  }

  async updateCoupon(id: string, updateCouponDto: UpdateCouponDto): Promise<any> {
    const coupon = await this.findCouponById(id);

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    const updateData: any = { ...updateCouponDto };
    if (updateCouponDto.discountValue !== undefined) {
      updateData.discountValue = updateCouponDto.discountValue.toString();
    }
    if (updateCouponDto.minOrderAmount !== undefined) {
      updateData.minOrderAmount = updateCouponDto.minOrderAmount.toString();
    }
    if (updateCouponDto.maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = updateCouponDto.maxDiscountAmount.toString();
    }

    const [updatedCoupon] = await db.update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();

    return updatedCoupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = await this.findCouponById(id);

    if (!coupon) {
      throw new NotFoundError('Coupon not found');
    }

    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async getAllCoupons(
    page: number = 1,
    limit: number = 10
  ): Promise<{ coupons: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const couponsResult = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coupons);

    const total = countResult ? Number(countResult.count) : 0;

    return { coupons: couponsResult, total };
  }
  
  async getCouponByCode(code: string): Promise<any | null> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    return coupon || null;
  }
}

import { db } from '../../../config/database';
import { coupons } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { CreateCouponDto, UpdateCouponDto } from '../dto/CouponDto';
import { BaseService } from '../../../core/base.service';

export class CouponService extends BaseService<typeof coupons> {
  constructor() {
    super(coupons);
  }

  async createCoupon(createCouponDto: CreateCouponDto): Promise<any> {
    return this.create({
      ...createCouponDto,
      discountValue: createCouponDto.discountValue.toString(),
      minOrderAmount: createCouponDto.minOrderAmount?.toString(),
      maxDiscountAmount: createCouponDto.maxDiscountAmount?.toString(),
    });
  }

  async updateCoupon(id: string, updateCouponDto: UpdateCouponDto): Promise<any> {
    await this.findByIdOrFail(id, 'Coupon');

    const updateData: any = { ...updateCouponDto };
    if (updateCouponDto.discountValue !== undefined) updateData.discountValue = updateCouponDto.discountValue.toString();
    if (updateCouponDto.minOrderAmount !== undefined) updateData.minOrderAmount = updateCouponDto.minOrderAmount.toString();
    if (updateCouponDto.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = updateCouponDto.maxDiscountAmount.toString();

    return this.update(id, updateData);
  }

  async getCouponByCode(code: string): Promise<any | null> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    return coupon || null;
  }
}

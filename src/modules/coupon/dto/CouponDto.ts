export interface CreateCouponDto {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  stackable?: boolean;
  appliesToShipping?: boolean;
  startDate: Date;
  endDate: Date;
}

export type UpdateCouponDto = Partial<CreateCouponDto> & {
  isActive?: boolean;
};

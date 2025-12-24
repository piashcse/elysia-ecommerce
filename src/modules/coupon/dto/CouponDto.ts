export interface CreateCouponDto {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    startDate: Date;
    endDate: Date;
}

export interface UpdateCouponDto {
    description?: string;
    discountValue?: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
}

export interface ValidateCouponDto {
    code: string;
    orderAmount: number;
    userId: string;
}

export interface CouponResponseDto {
    id: string;
    code: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CouponValidationResult {
    valid: boolean;
    discountAmount?: number;
    message?: string;
}

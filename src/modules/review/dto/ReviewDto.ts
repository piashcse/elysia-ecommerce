export interface CreateReviewDto {
    productId: string;
    rating: number;
    title?: string;
    comment?: string;
}

export interface UpdateReviewDto {
    rating?: number;
    title?: string;
    comment?: string;
}

export interface ReviewResponseDto {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    title: string | null;
    comment: string | null;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    isApproved: boolean;
    user?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
}

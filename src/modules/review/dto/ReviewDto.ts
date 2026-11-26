export interface CreateReviewDto {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export type UpdateReviewDto = Partial<Omit<CreateReviewDto, 'productId'>>;

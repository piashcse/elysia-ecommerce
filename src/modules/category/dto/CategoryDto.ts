export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

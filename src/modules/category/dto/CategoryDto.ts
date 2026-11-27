export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

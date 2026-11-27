export interface CreateProductDto {
  name: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
  weightGrams?: number;
  sku: string;
  isActive?: boolean;
  categoryId?: string;
  brandId?: string;
  sellerId: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;

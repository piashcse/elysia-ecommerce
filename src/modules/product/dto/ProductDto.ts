export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
  weightGrams?: number;
  sku: string;
  isActive?: boolean;
  categoryId?: string;
  sellerId: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;

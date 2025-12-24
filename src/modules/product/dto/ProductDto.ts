export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
  sku: string;
  isActive?: boolean;
  categoryId: string;
  sellerId: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  stockQuantity?: number;
  sku?: string;
  isActive?: boolean;
  categoryId?: string;
  sellerId?: string;
}

export interface ProductResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
  sku: string;
  isActive: boolean;
  categoryId: string | null;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}
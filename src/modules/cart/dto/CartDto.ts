// Cart DTOs (Data Transfer Objects)
export interface CreateCartDto {
  userId?: string;
  sessionId?: string; // For guest users
}

export interface AddToCartDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartResponseDto {
  id: string;
  userId: string | null;
  sessionId: string | null;
  items: Array<{
    id: string;
    productId: string;
    product?: {
      id: string;
      name: string;
      price: number;
      imageUrl: string | null;
    };
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
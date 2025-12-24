// Wishlist DTOs (Data Transfer Objects)
export interface CreateWishlistDto {
  userId: string;
  productId: string;
}

export interface WishlistResponseDto {
  id: string;
  userId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
  };
  createdAt: Date;
}
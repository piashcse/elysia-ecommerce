import { Wishlist } from '../entity/Wishlist';

// Wishlist DTOs (Data Transfer Objects)
export interface CreateWishlistDto {
  userId: string;
  productId: string;
}

export interface WishlistResponseDto {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  };
  createdAt: Date;
}

export interface WishlistListResponseDto {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  };
  createdAt: Date;
}
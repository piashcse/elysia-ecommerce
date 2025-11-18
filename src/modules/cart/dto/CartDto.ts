import { Cart } from '../entity/Cart';
import { CartItem } from '../entity/CartItem';

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
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  sessionId: string | null;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      image: string | null;
    };
    quantity: number;
    subtotal: number;
  }>;
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemResponseDto {
  id: string;
  cartId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  };
  quantity: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}
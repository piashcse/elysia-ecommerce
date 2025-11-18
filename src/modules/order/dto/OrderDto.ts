import { Order, OrderStatus } from '../entity/Order';

// Order DTOs (Data Transfer Objects)
export interface CreateOrderDto {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  notes?: string;
}

export interface OrderResponseDto {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      image: string | null;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Record<string, any>;
  billingAddress: Record<string, any> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderListResponseDto {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
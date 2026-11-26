import { OrderStatus } from '../validators/OrderValidator';
import type { OrderAddress } from '../../../database/schema/order';

// Order DTOs (Data Transfer Objects)
export interface CreateOrderDto {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  notes?: string;
  couponCode?: string;
  shippingMethodId?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  notes?: string;
  trackingNumber?: string;
}

export interface OrderResponseDto {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string | null;
    productName: string;
    productSku: string;
    productImageUrl: string | null;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
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

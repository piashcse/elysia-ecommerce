import type { OrderAddress } from '../../../database/schema/order';
import type { OrderStatus } from '../../../core/constants';

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

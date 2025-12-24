export interface CreateNotificationDto {
  userId: string;
  type: 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'payment_success' | 'payment_failed' | 'low_stock' | 'price_drop' | 'promotional' | 'system';
  title: string;
  message: string;
  link?: string;
}

export interface UpdateNotificationDto {
  isRead?: boolean;
}
